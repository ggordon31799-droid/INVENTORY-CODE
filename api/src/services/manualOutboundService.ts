import db from '../db/connection';
import { NotFoundError } from '../utils/errors';
import { applyDelta } from './inventoryService';
import { InventoryEventType } from '../types';

/**
 * Manual Outbound Service
 *
 * CONSTRAINT: All quantity decreases go through inventoryService.applyDelta().
 * This service must never write to products.qty_on_hand directly.
 * This service must never modify products.weighted_avg_cost.
 */

const VALID_TYPES = [
  'amazon_fba',
  'amazon_order',
  'damaged',
  'internal_use',
  'sample',
  'other',
];

export async function confirmOutbound(data: {
  outbound_type: string;
  reason_text?: string | null;
  reference_number?: string | null;
  created_by: string;
  line_items: Array<{
    product_id: number;
    qty: number;
  }>;
}) {
  if (!VALID_TYPES.includes(data.outbound_type)) {
    throw new Error(`Invalid outbound type: ${data.outbound_type}. Valid: ${VALID_TYPES.join(', ')}`);
  }
  if (!data.line_items || data.line_items.length === 0) {
    throw new Error('Outbound must have at least one line item');
  }
  if (!data.created_by) {
    throw new Error('created_by is required');
  }

  for (const line of data.line_items) {
    if (line.qty <= 0) {
      throw new Error('Quantity must be positive');
    }
  }

  return db.transaction(async (trx) => {
    // 1. Create outbound header
    const [outbound] = await trx('manual_outbound')
      .insert({
        outbound_type: data.outbound_type,
        reason_text: data.reason_text ?? null,
        reference_number: data.reference_number ?? null,
        created_by: data.created_by,
      })
      .returning('*');

    // 2. Process each line
    const outboundLines = [];

    for (const line of data.line_items) {
      // Read product for WAC snapshot (damaged type)
      const product = await trx('products')
        .where('id', line.product_id)
        .select('id', 'weighted_avg_cost')
        .first();

      if (!product) {
        throw new Error(`Product with id ${line.product_id} not found`);
      }

      // Snapshot WAC for damaged outbound
      const unitCostSnapshot =
        data.outbound_type === 'damaged'
          ? parseFloat(product.weighted_avg_cost)
          : null;

      // 2a. Create line item
      const [outboundLine] = await trx('manual_outbound_line_items')
        .insert({
          manual_outbound_id: outbound.id,
          product_id: line.product_id,
          qty: line.qty,
          unit_cost_snapshot: unitCostSnapshot,
        })
        .returning('*');

      outboundLines.push(outboundLine);

      // 2b. Decrease inventory through applyDelta
      await applyDelta({
        productId: Number(line.product_id),
        qtyDelta: -line.qty,
        eventType: InventoryEventType.MANUAL_OUTBOUND,
        sourceTable: 'manual_outbound_line_items',
        sourceId: Number(outboundLine.id),
        referenceCode: data.reference_number ?? data.outbound_type,
        performedBy: data.created_by,
        trx,
      });
    }

    return { ...outbound, line_items: outboundLines };
  });
}

export async function listOutbound(params: {
  outbound_type?: string;
  page?: number;
  limit?: number;
}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const offset = (page - 1) * limit;

  const query = db('manual_outbound');

  if (params.outbound_type) {
    query.where('outbound_type', params.outbound_type);
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

export async function getOutbound(id: number) {
  const outbound = await db('manual_outbound').where('id', id).first();
  if (!outbound) {
    throw new NotFoundError(`Manual outbound with id ${id} not found`);
  }

  const lineItems = await db('manual_outbound_line_items')
    .join('products', 'manual_outbound_line_items.product_id', 'products.id')
    .where('manual_outbound_line_items.manual_outbound_id', id)
    .select(
      'manual_outbound_line_items.*',
      'products.sku',
      'products.product_name'
    );

  return { ...outbound, line_items: lineItems };
}

export async function getDamagedReport(params: {
  page?: number;
  limit?: number;
}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const offset = (page - 1) * limit;

  const baseQuery = db('manual_outbound_line_items')
    .join('manual_outbound', 'manual_outbound_line_items.manual_outbound_id', 'manual_outbound.id')
    .join('products', 'manual_outbound_line_items.product_id', 'products.id')
    .where('manual_outbound.outbound_type', 'damaged');

  const countQuery = baseQuery.clone().count('* as count').first();

  const dataQuery = baseQuery
    .clone()
    .select(
      'manual_outbound_line_items.id',
      'manual_outbound_line_items.qty',
      'manual_outbound_line_items.unit_cost_snapshot',
      'manual_outbound_line_items.created_at',
      'manual_outbound.id as outbound_id',
      'manual_outbound.reference_number',
      'manual_outbound.created_by',
      'products.sku',
      'products.product_name',
      db.raw('(manual_outbound_line_items.qty * manual_outbound_line_items.unit_cost_snapshot) as total_cost')
    )
    .orderBy('manual_outbound_line_items.created_at', 'desc')
    .limit(limit)
    .offset(offset);

  // Total damaged value
  const totalValueQuery = db('manual_outbound_line_items')
    .join('manual_outbound', 'manual_outbound_line_items.manual_outbound_id', 'manual_outbound.id')
    .where('manual_outbound.outbound_type', 'damaged')
    .sum(db.raw('manual_outbound_line_items.qty * manual_outbound_line_items.unit_cost_snapshot as total_damaged_value'))
    .first();

  const [countResult, data, totalValue] = await Promise.all([
    countQuery,
    dataQuery,
    totalValueQuery,
  ]);

  const total = Number((countResult as any)?.count ?? 0);

  return {
    data,
    total,
    page,
    limit,
    total_damaged_value: parseFloat((totalValue as any)?.total_damaged_value ?? '0'),
  };
}
