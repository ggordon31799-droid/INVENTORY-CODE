import db from '../db/connection';
import { NotFoundError } from '../utils/errors';
import { applyDelta } from './inventoryService';
import { InventoryEventType } from '../types';

/**
 * Inventory Adjustment Service
 *
 * CONSTRAINT: All quantity changes go through inventoryService.applyDelta().
 * This service must never write to products.qty_on_hand directly.
 * This service must never modify products.weighted_avg_cost.
 */

const VALID_REASONS = [
  'count_correction',
  'write_off',
  'found_inventory',
  'shipment_correction',
  'data_fix',
  'other',
];

export async function confirmAdjustment(data: {
  product_id: number;
  new_qty?: number;
  qty_delta?: number;
  reason: string;
  notes?: string | null;
  adjusted_by: string;
  cycle_count_id?: number | null;
}) {
  if (!VALID_REASONS.includes(data.reason)) {
    throw new Error(`Invalid reason: ${data.reason}. Valid: ${VALID_REASONS.join(', ')}`);
  }
  if (!data.adjusted_by) {
    throw new Error('adjusted_by is required');
  }

  // Must provide either new_qty or qty_delta
  if (data.new_qty === undefined && data.qty_delta === undefined) {
    throw new Error('Either new_qty or qty_delta is required');
  }

  return db.transaction(async (trx) => {
    const product = await trx('products')
      .where('id', data.product_id)
      .select('id', 'qty_on_hand')
      .first();

    if (!product) {
      throw new NotFoundError(`Product with id ${data.product_id} not found`);
    }

    const previousQty = product.qty_on_hand;
    let qtyDelta: number;
    let newQty: number;

    if (data.qty_delta !== undefined) {
      qtyDelta = data.qty_delta;
      newQty = previousQty + qtyDelta;
    } else {
      newQty = data.new_qty!;
      qtyDelta = newQty - previousQty;
    }

    if (qtyDelta === 0) {
      throw new Error('Adjustment results in no quantity change');
    }

    // 1. Create adjustment record
    const [adjustment] = await trx('inventory_adjustments')
      .insert({
        product_id: data.product_id,
        previous_qty: previousQty,
        new_qty: newQty,
        qty_delta: qtyDelta,
        reason: data.reason,
        notes: data.notes ?? null,
        cycle_count_id: data.cycle_count_id ?? null,
        adjusted_by: data.adjusted_by,
      })
      .returning('*');

    // 2. Apply inventory change through applyDelta
    await applyDelta({
      productId: Number(data.product_id),
      qtyDelta,
      eventType: InventoryEventType.ADJUSTMENT,
      sourceTable: 'inventory_adjustments',
      sourceId: Number(adjustment.id),
      performedBy: data.adjusted_by,
      trx,
    });

    return adjustment;
  });
}

export async function listAdjustments(params: {
  product_id?: number;
  reason?: string;
  page?: number;
  limit?: number;
}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const offset = (page - 1) * limit;

  const query = db('inventory_adjustments')
    .join('products', 'inventory_adjustments.product_id', 'products.id');

  if (params.product_id) {
    query.where('inventory_adjustments.product_id', params.product_id);
  }
  if (params.reason) {
    query.where('inventory_adjustments.reason', params.reason);
  }

  const countQuery = query.clone().count('* as count').first();
  const dataQuery = query
    .clone()
    .select(
      'inventory_adjustments.*',
      'products.sku',
      'products.product_name'
    )
    .orderBy('inventory_adjustments.created_at', 'desc')
    .limit(limit)
    .offset(offset);

  const [countResult, data] = await Promise.all([countQuery, dataQuery]);
  const total = Number((countResult as any)?.count ?? 0);

  return { data, total, page, limit };
}

export async function getAdjustment(id: number) {
  const adjustment = await db('inventory_adjustments')
    .join('products', 'inventory_adjustments.product_id', 'products.id')
    .where('inventory_adjustments.id', id)
    .select(
      'inventory_adjustments.*',
      'products.sku',
      'products.product_name'
    )
    .first();

  if (!adjustment) {
    throw new NotFoundError(`Adjustment with id ${id} not found`);
  }

  return adjustment;
}
