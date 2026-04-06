import db from '../db/connection';
import { NotFoundError } from '../utils/errors';
import { applyDelta } from './inventoryService';
import { InventoryEventType } from '../types';
import crypto from 'crypto';

/**
 * Order Service
 *
 * CONSTRAINT: Shipment decreases inventory ONLY via inventoryService.applyDelta().
 * This service must never write to products.qty_on_hand directly.
 */

// --- Helpers ---

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `ORD-${ts}-${rand}`;
}

// --- Order CRUD ---

export async function listOrders(params: {
  status?: string;
  source?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const offset = (page - 1) * limit;

  const query = db('orders');

  if (params.status) {
    query.where('status', params.status);
  }
  if (params.source) {
    query.where('source', params.source);
  }
  if (params.search) {
    const term = `%${params.search}%`;
    query.where(function () {
      this.whereILike('order_number', term)
        .orWhereILike('external_order_id', term)
        .orWhereILike('customer_name', term);
    });
  }

  const countQuery = query.clone().count('* as count').first();
  const dataQuery = query
    .clone()
    .select('*')
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);

  const [countResult, data] = await Promise.all([countQuery, dataQuery]);
  const total = Number((countResult as any)?.count ?? 0);

  return { data, total, page, limit };
}

export async function getOrder(id: number) {
  const order = await db('orders').where('id', id).first();
  if (!order) {
    throw new NotFoundError(`Order with id ${id} not found`);
  }

  const lineItems = await db('order_line_items')
    .leftJoin('products', 'order_line_items.product_id', 'products.id')
    .where('order_line_items.order_id', id)
    .select(
      'order_line_items.*',
      'products.sku',
      'products.product_name',
      'products.qty_on_hand'
    )
    .orderBy('order_line_items.id', 'asc');

  return { ...order, line_items: lineItems };
}

export async function createOrder(data: {
  customer_name?: string;
  order_date?: string;
  notes?: string;
  line_items: Array<{
    product_id: number;
    ordered_qty: number;
  }>;
}) {
  if (!data.line_items || data.line_items.length === 0) {
    throw new Error('Order must have at least one line item');
  }

  return db.transaction(async (trx) => {
    const [order] = await trx('orders')
      .insert({
        order_number: generateOrderNumber(),
        source: 'manual',
        status: 'pending',
        customer_name: data.customer_name ?? null,
        order_date: data.order_date ?? null,
        notes: data.notes ?? null,
      })
      .returning('*');

    const lineRows = data.line_items.map((line) => ({
      order_id: order.id,
      product_id: line.product_id,
      ordered_qty: line.ordered_qty,
      shipped_qty: 0,
      line_status: 'pending',
      is_matched: true,
    }));

    await trx('order_line_items').insert(lineRows);

    const lineItems = await trx('order_line_items')
      .where('order_id', order.id)
      .select('*');

    return { ...order, line_items: lineItems };
  });
}

export async function cancelOrder(id: number) {
  const order = await db('orders').where('id', id).first();
  if (!order) {
    throw new NotFoundError(`Order with id ${id} not found`);
  }
  if (order.status === 'cancelled') {
    throw new Error('Order is already cancelled');
  }
  if (order.status === 'shipped') {
    throw new Error('Cannot cancel a fully shipped order');
  }

  // Per docs: cancellation does not reverse already-shipped inventory
  await db('orders')
    .where('id', id)
    .update({ status: 'cancelled', updated_at: db.fn.now() });

  return getOrder(id);
}

// --- Sync stub ---

export async function syncOrders() {
  // TODO: Implement eBay and WooCommerce API polling
  // For now, return a stub response
  return {
    message: 'Order sync is not yet implemented. eBay and WooCommerce integrations are planned.',
    imported: 0,
  };
}

// --- SKU resolution ---

export async function resolveLineItem(orderId: number, lineId: number, productId: number) {
  const order = await db('orders').where('id', orderId).first();
  if (!order) {
    throw new NotFoundError(`Order with id ${orderId} not found`);
  }

  const line = await db('order_line_items')
    .where({ id: lineId, order_id: orderId })
    .first();

  if (!line) {
    throw new NotFoundError(`Order line item ${lineId} not found on order ${orderId}`);
  }

  // Verify product exists
  const product = await db('products').where('id', productId).first();
  if (!product) {
    throw new NotFoundError(`Product with id ${productId} not found`);
  }

  await db('order_line_items')
    .where('id', lineId)
    .update({
      product_id: productId,
      is_matched: true,
      updated_at: db.fn.now(),
    });

  return getOrder(orderId);
}

// --- Today's Work ---

export async function getTodaysOrders() {
  const orders = await db('orders')
    .whereIn('status', ['pending', 'partially_shipped'])
    .orderBy('order_date', 'asc')
    .select('*');

  // Attach line items with current qty_on_hand for stock awareness
  for (const order of orders) {
    order.line_items = await db('order_line_items')
      .leftJoin('products', 'order_line_items.product_id', 'products.id')
      .where('order_line_items.order_id', order.id)
      .select(
        'order_line_items.*',
        'products.sku',
        'products.product_name',
        'products.qty_on_hand'
      )
      .orderBy('order_line_items.id', 'asc');
  }

  return orders;
}

// --- Scan Lookup ---

export async function scanLookup(code: string) {
  // Search by order_number, external_order_id, or product barcode
  // 1. Check order_number
  let order = await db('orders').where('order_number', code).first();
  if (order) {
    return getOrder(Number(order.id));
  }

  // 2. Check external_order_id
  order = await db('orders').where('external_order_id', code).first();
  if (order) {
    return getOrder(Number(order.id));
  }

  // 3. Check product barcode → find pending orders containing that product
  const product = await db('products').where('barcode', code).first();
  if (product) {
    const orderIds = await db('order_line_items')
      .join('orders', 'order_line_items.order_id', 'orders.id')
      .where('order_line_items.product_id', product.id)
      .whereIn('orders.status', ['pending', 'partially_shipped'])
      .select('orders.id')
      .orderBy('orders.order_date', 'asc')
      .limit(1);

    if (orderIds.length > 0) {
      return getOrder(Number(orderIds[0].id));
    }
  }

  return null;
}

// --- Shipping ---

export async function confirmShipment(
  orderId: number,
  data: {
    shipped_by: string;
    tracking_number?: string | null;
    line_items: Array<{
      order_line_item_id: number;
      shipped_qty: number;
    }>;
  }
) {
  if (!data.line_items || data.line_items.length === 0) {
    throw new Error('Shipment must have at least one line item');
  }

  const order = await db('orders').where('id', orderId).first();
  if (!order) {
    throw new NotFoundError(`Order with id ${orderId} not found`);
  }
  if (order.status === 'shipped') {
    throw new Error('Order is already fully shipped');
  }
  if (order.status === 'cancelled') {
    throw new Error('Cannot ship a cancelled order');
  }

  // Check for unmatched lines
  const unmatchedLines = await db('order_line_items')
    .where('order_id', orderId)
    .where('is_matched', false)
    .select('id');

  if (unmatchedLines.length > 0) {
    throw new Error('Cannot ship order with unmatched SKUs. Resolve all SKUs first.');
  }

  // Load order line items
  const orderLines = await db('order_line_items')
    .where('order_id', orderId)
    .select('*');

  const orderLineMap = new Map(orderLines.map((l: any) => [Number(l.id), l]));

  // Validate and collect warnings
  const warnings: string[] = [];
  for (const line of data.line_items) {
    const orderLine = orderLineMap.get(Number(line.order_line_item_id));
    if (!orderLine) {
      throw new Error(`Order line item ${line.order_line_item_id} not found on order ${orderId}`);
    }
    if (line.shipped_qty <= 0) {
      throw new Error(`Shipped quantity must be positive for line ${line.order_line_item_id}`);
    }
  }

  // Check stock warnings (warn but don't block per docs)
  for (const line of data.line_items) {
    const orderLine = orderLineMap.get(Number(line.order_line_item_id))!;
    const product = await db('products')
      .where('id', orderLine.product_id)
      .select('qty_on_hand', 'sku')
      .first();

    if (product && product.qty_on_hand < line.shipped_qty) {
      warnings.push(
        `Insufficient stock for ${product.sku}: on hand ${product.qty_on_hand}, shipping ${line.shipped_qty}`
      );
    }
  }

  return db.transaction(async (trx) => {
    // 1. Create shipment header
    const [shipment] = await trx('shipments')
      .insert({
        order_id: orderId,
        tracking_number: data.tracking_number ?? null,
        batch_id: null,
        shipped_by: data.shipped_by,
      })
      .returning('*');

    // 2. Process each line
    const shipmentLines = [];

    for (const line of data.line_items) {
      const orderLine = orderLineMap.get(Number(line.order_line_item_id))!;

      // 2a. Create shipment_line_item
      const [shipmentLine] = await trx('shipment_line_items')
        .insert({
          shipment_id: shipment.id,
          order_line_item_id: line.order_line_item_id,
          product_id: orderLine.product_id,
          shipped_qty: line.shipped_qty,
        })
        .returning('*');

      shipmentLines.push(shipmentLine);

      // 2b. Update order_line_items
      const newShippedQty = orderLine.shipped_qty + line.shipped_qty;
      let lineStatus = 'partial';
      if (newShippedQty >= orderLine.ordered_qty) {
        lineStatus = 'complete';
      }

      await trx('order_line_items')
        .where('id', line.order_line_item_id)
        .update({
          shipped_qty: newShippedQty,
          line_status: lineStatus,
          updated_at: trx.fn.now(),
        });

      // 2c. Decrease inventory through applyDelta
      await applyDelta({
        productId: Number(orderLine.product_id),
        qtyDelta: -line.shipped_qty,
        eventType: InventoryEventType.SHIPMENT,
        sourceTable: 'shipment_line_items',
        sourceId: Number(shipmentLine.id),
        referenceCode: order.external_order_id || order.order_number,
        performedBy: data.shipped_by,
        trx,
      });
    }

    // 3. Update order status
    const updatedLines = await trx('order_line_items')
      .where('order_id', orderId)
      .select('line_status');

    const allComplete = updatedLines.every((l: any) => l.line_status === 'complete');
    const anyShipped = updatedLines.some(
      (l: any) => l.line_status === 'partial' || l.line_status === 'complete'
    );

    let newStatus = order.status;
    let shipDate = null;
    if (allComplete) {
      newStatus = 'shipped';
      shipDate = trx.fn.now();
    } else if (anyShipped) {
      newStatus = 'partially_shipped';
    }

    const orderUpdate: Record<string, any> = { updated_at: trx.fn.now() };
    if (newStatus !== order.status) {
      orderUpdate.status = newStatus;
    }
    if (shipDate) {
      orderUpdate.ship_date = shipDate;
    }

    await trx('orders').where('id', orderId).update(orderUpdate);

    return {
      shipment: { ...shipment, line_items: shipmentLines },
      warnings,
    };
  });
}

// --- Batch Ship ---

export async function batchShip(data: {
  shipped_by: string;
  orders: Array<{
    order_id: number;
    tracking_number?: string | null;
    line_items: Array<{
      order_line_item_id: number;
      shipped_qty: number;
    }>;
  }>;
}) {
  if (!data.orders || data.orders.length === 0) {
    throw new Error('Batch must contain at least one order');
  }

  const batchId = `BATCH-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

  return db.transaction(async (trx) => {
    const results = [];

    for (const orderData of data.orders) {
      const order = await trx('orders').where('id', orderData.order_id).first();
      if (!order) {
        throw new NotFoundError(`Order with id ${orderData.order_id} not found`);
      }
      if (order.status === 'shipped' || order.status === 'cancelled') {
        throw new Error(`Order ${order.order_number} cannot be shipped (status: ${order.status})`);
      }

      // Check unmatched
      const unmatched = await trx('order_line_items')
        .where('order_id', orderData.order_id)
        .where('is_matched', false)
        .count('* as count')
        .first();

      if (Number(unmatched?.count) > 0) {
        throw new Error(`Order ${order.order_number} has unmatched SKUs`);
      }

      const orderLines = await trx('order_line_items')
        .where('order_id', orderData.order_id)
        .select('*');

      const orderLineMap = new Map(orderLines.map((l: any) => [Number(l.id), l]));

      // Create shipment
      const [shipment] = await trx('shipments')
        .insert({
          order_id: orderData.order_id,
          tracking_number: orderData.tracking_number ?? null,
          batch_id: batchId,
          shipped_by: data.shipped_by,
        })
        .returning('*');

      for (const line of orderData.line_items) {
        const orderLine = orderLineMap.get(Number(line.order_line_item_id));
        if (!orderLine) {
          throw new Error(`Line ${line.order_line_item_id} not found on order ${order.order_number}`);
        }

        const [shipmentLine] = await trx('shipment_line_items')
          .insert({
            shipment_id: shipment.id,
            order_line_item_id: line.order_line_item_id,
            product_id: orderLine.product_id,
            shipped_qty: line.shipped_qty,
          })
          .returning('*');

        const newShippedQty = orderLine.shipped_qty + line.shipped_qty;
        let lineStatus = 'partial';
        if (newShippedQty >= orderLine.ordered_qty) {
          lineStatus = 'complete';
        }

        await trx('order_line_items')
          .where('id', line.order_line_item_id)
          .update({
            shipped_qty: newShippedQty,
            line_status: lineStatus,
            updated_at: trx.fn.now(),
          });

        await applyDelta({
          productId: Number(orderLine.product_id),
          qtyDelta: -line.shipped_qty,
          eventType: InventoryEventType.SHIPMENT,
          sourceTable: 'shipment_line_items',
          sourceId: Number(shipmentLine.id),
          referenceCode: order.external_order_id || order.order_number,
          performedBy: data.shipped_by,
          trx,
        });
      }

      // Update order status
      const updatedLines = await trx('order_line_items')
        .where('order_id', orderData.order_id)
        .select('line_status');

      const allComplete = updatedLines.every((l: any) => l.line_status === 'complete');
      const anyShipped = updatedLines.some(
        (l: any) => l.line_status === 'partial' || l.line_status === 'complete'
      );

      const orderUpdate: Record<string, any> = { updated_at: trx.fn.now() };
      if (allComplete) {
        orderUpdate.status = 'shipped';
        orderUpdate.ship_date = trx.fn.now();
      } else if (anyShipped) {
        orderUpdate.status = 'partially_shipped';
      }

      await trx('orders').where('id', orderData.order_id).update(orderUpdate);

      results.push({ order_id: orderData.order_id, shipment_id: shipment.id });
    }

    return { batch_id: batchId, results };
  });
}

// --- Shipment queries ---

export async function getShipmentsForOrder(orderId: number) {
  const order = await db('orders').where('id', orderId).first();
  if (!order) {
    throw new NotFoundError(`Order with id ${orderId} not found`);
  }

  const shipments = await db('shipments')
    .where('order_id', orderId)
    .orderBy('created_at', 'desc')
    .select('*');

  for (const shipment of shipments) {
    shipment.line_items = await db('shipment_line_items')
      .join('products', 'shipment_line_items.product_id', 'products.id')
      .where('shipment_line_items.shipment_id', shipment.id)
      .select(
        'shipment_line_items.*',
        'products.sku',
        'products.product_name'
      );
  }

  return shipments;
}
