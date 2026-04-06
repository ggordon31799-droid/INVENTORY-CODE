import db from '../db/connection';
import { NotFoundError } from '../utils/errors';
import { applyDelta } from './inventoryService';
import { recalculateWAC } from './costService';
import { InventoryEventType } from '../types';

/**
 * Purchase Order Service
 *
 * CONSTRAINT: Receiving increases inventory ONLY via inventoryService.applyDelta().
 * This service must never write to products.qty_on_hand directly.
 */

// --- PO CRUD ---

export async function listPurchaseOrders(params: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const offset = (page - 1) * limit;

  const query = db('purchase_orders');

  if (params.status) {
    query.where('status', params.status);
  }

  if (params.search) {
    const term = `%${params.search}%`;
    query.where(function () {
      this.whereILike('po_number', term)
        .orWhereILike('supplier', term);
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

export async function getPurchaseOrder(id: number) {
  const po = await db('purchase_orders').where('id', id).first();
  if (!po) {
    throw new NotFoundError(`Purchase order with id ${id} not found`);
  }

  const lineItems = await db('po_line_items')
    .join('products', 'po_line_items.product_id', 'products.id')
    .where('po_line_items.purchase_order_id', id)
    .select(
      'po_line_items.*',
      'products.sku',
      'products.product_name'
    )
    .orderBy('po_line_items.id', 'asc');

  return { ...po, line_items: lineItems };
}

export async function createPurchaseOrder(data: {
  po_number: string;
  supplier: string;
  expected_date?: string | null;
  notes?: string | null;
  line_items: Array<{
    product_id: number;
    ordered_qty: number;
    unit_cost: number;
  }>;
}) {
  if (!data.line_items || data.line_items.length === 0) {
    throw new Error('Purchase order must have at least one line item');
  }

  return db.transaction(async (trx) => {
    const [po] = await trx('purchase_orders')
      .insert({
        po_number: data.po_number,
        supplier: data.supplier,
        expected_date: data.expected_date ?? null,
        notes: data.notes ?? null,
        status: 'open',
      })
      .returning('*');

    const lineRows = data.line_items.map((line) => ({
      purchase_order_id: po.id,
      product_id: line.product_id,
      ordered_qty: line.ordered_qty,
      unit_cost: line.unit_cost,
      received_qty: 0,
      line_status: 'open',
    }));

    await trx('po_line_items').insert(lineRows);

    const lineItems = await trx('po_line_items')
      .where('purchase_order_id', po.id)
      .select('*');

    return { ...po, line_items: lineItems };
  });
}

export async function updatePurchaseOrder(
  id: number,
  data: {
    supplier?: string;
    expected_date?: string | null;
    notes?: string | null;
  }
) {
  const po = await db('purchase_orders').where('id', id).first();
  if (!po) {
    throw new NotFoundError(`Purchase order with id ${id} not found`);
  }
  if (po.status === 'closed') {
    throw new Error('Cannot edit a closed purchase order');
  }
  if (po.status === 'voided') {
    throw new Error('Cannot edit a voided purchase order');
  }

  const ALLOWED_FIELDS = ['supplier', 'expected_date', 'notes'];

  const updatePayload: Record<string, any> = {};
  for (const key of ALLOWED_FIELDS) {
    if ((data as any)[key] !== undefined) {
      updatePayload[key] = (data as any)[key];
    }
  }

  if (Object.keys(updatePayload).length === 0) {
    return getPurchaseOrder(id);
  }

  updatePayload.updated_at = db.fn.now();

  const [po] = await db('purchase_orders')
    .where('id', id)
    .update(updatePayload)
    .returning('*');

  if (!po) {
    throw new NotFoundError(`Purchase order with id ${id} not found`);
  }

  return getPurchaseOrder(id);
}

export async function closePurchaseOrder(id: number) {
  const po = await db('purchase_orders').where('id', id).first();
  if (!po) {
    throw new NotFoundError(`Purchase order with id ${id} not found`);
  }
  if (po.status === 'closed') {
    throw new Error('Purchase order is already closed');
  }
  if (po.status === 'voided') {
    throw new Error('Cannot close a voided purchase order');
  }

  await db('purchase_orders')
    .where('id', id)
    .update({ status: 'closed', updated_at: db.fn.now() });

  return getPurchaseOrder(id);
}

export async function voidPurchaseOrder(id: number) {
  const po = await db('purchase_orders').where('id', id).first();
  if (!po) {
    throw new NotFoundError(`Purchase order with id ${id} not found`);
  }
  if (po.status === 'voided') {
    throw new Error('Purchase order is already voided');
  }
  if (po.status === 'closed') {
    throw new Error('Cannot void a closed purchase order');
  }

  // Block voiding if any receipts exist
  const receiptCount = await db('receipts')
    .where('purchase_order_id', id)
    .count('* as count')
    .first();

  if (Number(receiptCount?.count) > 0) {
    throw new Error(
      'Cannot void a purchase order with existing receipts. ' +
      'Use inventory adjustments to correct received quantities.'
    );
  }

  // Block voiding if any line has received_qty > 0
  const receivedLine = await db('po_line_items')
    .where('purchase_order_id', id)
    .where('received_qty', '>', 0)
    .first();

  if (receivedLine) {
    throw new Error(
      'Cannot void a purchase order with received inventory. ' +
      'Use inventory adjustments to correct received quantities.'
    );
  }

  await db('purchase_orders')
    .where('id', id)
    .update({ status: 'voided', updated_at: db.fn.now() });

  return getPurchaseOrder(id);
}

// --- Receiving ---

export async function confirmReceipt(
  poId: number,
  data: {
    bol_number?: string | null;
    received_by: string;
    line_items: Array<{
      po_line_item_id: number;
      received_qty: number;
    }>;
  }
) {
  if (!data.line_items || data.line_items.length === 0) {
    throw new Error('Receipt must have at least one line item');
  }

  // Validate PO exists and is receivable
  const po = await db('purchase_orders').where('id', poId).first();
  if (!po) {
    throw new NotFoundError(`Purchase order with id ${poId} not found`);
  }
  if (po.status === 'closed') {
    throw new Error('Cannot receive against a closed purchase order');
  }
  if (po.status === 'voided') {
    throw new Error('Cannot receive against a voided purchase order');
  }

  // Load PO line items
  const poLines = await db('po_line_items')
    .where('purchase_order_id', poId)
    .select('*');

  const poLineMap = new Map(poLines.map((l: any) => [Number(l.id), l]));

  // Validate all receipt lines reference valid PO lines
  const warnings: string[] = [];
  for (const line of data.line_items) {
    const poLine = poLineMap.get(Number(line.po_line_item_id));
    if (!poLine) {
      throw new Error(`PO line item ${line.po_line_item_id} not found on PO ${poId}`);
    }
    if (line.received_qty <= 0) {
      throw new Error(`Received quantity must be positive for PO line ${line.po_line_item_id}`);
    }
    // Over-receiving: warn but don't block
    const remaining = poLine.ordered_qty - poLine.received_qty;
    if (line.received_qty > remaining) {
      warnings.push(
        `Over-receiving on line ${line.po_line_item_id}: ` +
        `receiving ${line.received_qty}, remaining was ${remaining}`
      );
    }
  }

  return db.transaction(async (trx) => {
    // 1. Create receipt header
    const [receipt] = await trx('receipts')
      .insert({
        purchase_order_id: poId,
        bol_number: data.bol_number ?? null,
        received_by: data.received_by,
      })
      .returning('*');

    // 2. Process each line item
    const receiptLines = [];

    for (const line of data.line_items) {
      const poLine = poLineMap.get(Number(line.po_line_item_id))!;

      // 2a. Create receipt_line_item
      const [receiptLine] = await trx('receipt_line_items')
        .insert({
          receipt_id: receipt.id,
          po_line_item_id: line.po_line_item_id,
          product_id: poLine.product_id,
          received_qty: line.received_qty,
          unit_cost: poLine.unit_cost,
        })
        .returning('*');

      receiptLines.push(receiptLine);

      // 2b. Update po_line_items.received_qty and line_status
      const newReceivedQty = poLine.received_qty + line.received_qty;
      let lineStatus = 'partial';
      if (newReceivedQty >= poLine.ordered_qty) {
        lineStatus = 'complete';
      }

      await trx('po_line_items')
        .where('id', line.po_line_item_id)
        .update({
          received_qty: newReceivedQty,
          line_status: lineStatus,
          updated_at: trx.fn.now(),
        });

      // 2c. Recalculate WAC (BEFORE applyDelta, uses current qty_on_hand)
      await recalculateWAC({
        productId: Number(poLine.product_id),
        receiptQty: line.received_qty,
        receiptUnitCost: parseFloat(poLine.unit_cost),
        trx,
      });

      // 2d. Increase inventory through applyDelta
      await applyDelta({
        productId: Number(poLine.product_id),
        qtyDelta: line.received_qty,
        eventType: InventoryEventType.RECEIPT,
        sourceTable: 'receipt_line_items',
        sourceId: Number(receiptLine.id),
        referenceCode: po.po_number,
        performedBy: data.received_by,
        trx,
      });
    }

    // 3. Update PO status
    const updatedLines = await trx('po_line_items')
      .where('purchase_order_id', poId)
      .select('line_status');

    const allComplete = updatedLines.every((l: any) => l.line_status === 'complete');
    const anyReceived = updatedLines.some(
      (l: any) => l.line_status === 'partial' || l.line_status === 'complete'
    );

    let newPoStatus = po.status;
    if (allComplete) {
      newPoStatus = 'fully_received';
    } else if (anyReceived) {
      newPoStatus = 'partially_received';
    }

    if (newPoStatus !== po.status) {
      await trx('purchase_orders')
        .where('id', poId)
        .update({ status: newPoStatus, updated_at: trx.fn.now() });
    }

    return {
      receipt: { ...receipt, line_items: receiptLines },
      warnings,
    };
  });
}

// --- Receipt queries ---

export async function getReceiptsForPO(poId: number) {
  const po = await db('purchase_orders').where('id', poId).first();
  if (!po) {
    throw new NotFoundError(`Purchase order with id ${poId} not found`);
  }

  const receipts = await db('receipts')
    .where('purchase_order_id', poId)
    .orderBy('created_at', 'desc')
    .select('*');

  for (const receipt of receipts) {
    receipt.line_items = await db('receipt_line_items')
      .join('products', 'receipt_line_items.product_id', 'products.id')
      .where('receipt_line_items.receipt_id', receipt.id)
      .select(
        'receipt_line_items.*',
        'products.sku',
        'products.product_name'
      );
  }

  return receipts;
}

export async function getReceipt(receiptId: number) {
  const receipt = await db('receipts').where('id', receiptId).first();
  if (!receipt) {
    throw new NotFoundError(`Receipt with id ${receiptId} not found`);
  }

  const lineItems = await db('receipt_line_items')
    .join('products', 'receipt_line_items.product_id', 'products.id')
    .where('receipt_line_items.receipt_id', receiptId)
    .select(
      'receipt_line_items.*',
      'products.sku',
      'products.product_name'
    );

  return { ...receipt, line_items: lineItems };
}
