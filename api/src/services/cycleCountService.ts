import db from '../db/connection';
import { NotFoundError } from '../utils/errors';
import { applyDelta } from './inventoryService';
import { InventoryEventType } from '../types';

/**
 * Cycle Count Service
 *
 * CONSTRAINT: All quantity changes from finalized counts go through
 * inventoryService.applyDelta(). This service must never write to
 * products.qty_on_hand directly.
 */

export async function createCycleCount(data: {
  scope_type: string;
  scope_value?: string | null;
  product_ids?: number[];
  counted_by: string;
}) {
  if (!data.counted_by) {
    throw new Error('counted_by is required');
  }

  return db.transaction(async (trx) => {
    // Determine which products to include
    let productQuery = trx('products')
      .where('status', 'active')
      .select('id', 'qty_on_hand');

    if (data.scope_type === 'category' && data.scope_value) {
      productQuery = productQuery.where('category', data.scope_value);
    } else if (data.scope_type === 'location' && data.scope_value) {
      productQuery = productQuery.where('location', data.scope_value);
    } else if (data.scope_type === 'custom' && data.product_ids?.length) {
      productQuery = productQuery.whereIn('id', data.product_ids);
    }
    // scope_type === 'all' → no additional filter

    const products = await productQuery;

    if (products.length === 0) {
      throw new Error('No products found for the selected scope');
    }

    // Create count header
    const [count] = await trx('cycle_counts')
      .insert({
        status: 'in_progress',
        scope_type: data.scope_type,
        scope_value: data.scope_value ?? null,
        total_skus: products.length,
        counted_by: data.counted_by,
      })
      .returning('*');

    // Create count lines with system_qty snapshot
    const lines = products.map((p: any) => ({
      cycle_count_id: count.id,
      product_id: p.id,
      system_qty: p.qty_on_hand,
    }));

    await trx('cycle_count_lines').insert(lines);

    return getCycleCountDetail(Number(count.id), trx);
  });
}

async function getCycleCountDetail(id: number, trxOrDb: any = db) {
  const count = await trxOrDb('cycle_counts').where('id', id).first();
  if (!count) {
    throw new NotFoundError(`Cycle count with id ${id} not found`);
  }

  const lines = await trxOrDb('cycle_count_lines')
    .join('products', 'cycle_count_lines.product_id', 'products.id')
    .where('cycle_count_lines.cycle_count_id', id)
    .select(
      'cycle_count_lines.*',
      'products.sku',
      'products.product_name',
      'products.location'
    )
    .orderBy('products.sku', 'asc');

  return { ...count, lines };
}

export async function listCycleCounts(params: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const offset = (page - 1) * limit;

  const query = db('cycle_counts');

  if (params.status) {
    query.where('status', params.status);
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

export async function getCycleCount(id: number) {
  return getCycleCountDetail(id);
}

// Update a single count line (enter counted_qty)
export async function updateCountLine(
  countId: number,
  lineId: number,
  data: { counted_qty: number }
) {
  const count = await db('cycle_counts').where('id', countId).first();
  if (!count) {
    throw new NotFoundError(`Cycle count with id ${countId} not found`);
  }
  if (count.status !== 'in_progress') {
    throw new Error('Cannot update lines on a completed count');
  }

  const line = await db('cycle_count_lines')
    .where({ id: lineId, cycle_count_id: countId })
    .first();

  if (!line) {
    throw new NotFoundError(`Count line ${lineId} not found on count ${countId}`);
  }

  const variance = data.counted_qty - line.system_qty;

  await db('cycle_count_lines')
    .where('id', lineId)
    .update({
      counted_qty: data.counted_qty,
      variance,
      updated_at: db.fn.now(),
    });

  return getCycleCountDetail(countId);
}

// Review: returns discrepancy report (lines with variance != 0)
export async function reviewCount(countId: number) {
  const count = await db('cycle_counts').where('id', countId).first();
  if (!count) {
    throw new NotFoundError(`Cycle count with id ${countId} not found`);
  }
  if (count.status !== 'in_progress') {
    throw new Error('Count is already completed');
  }

  // Check all lines have been counted
  const uncounted = await db('cycle_count_lines')
    .where('cycle_count_id', countId)
    .whereNull('counted_qty')
    .count('* as count')
    .first();

  if (Number(uncounted?.count) > 0) {
    throw new Error(`${uncounted?.count} lines have not been counted yet`);
  }

  const lines = await db('cycle_count_lines')
    .join('products', 'cycle_count_lines.product_id', 'products.id')
    .where('cycle_count_lines.cycle_count_id', countId)
    .select(
      'cycle_count_lines.*',
      'products.sku',
      'products.product_name',
      'products.location'
    )
    .orderBy('products.sku', 'asc');

  const discrepancies = lines.filter((l: any) => l.variance !== 0);

  return {
    count_id: countId,
    total_lines: lines.length,
    discrepancy_count: discrepancies.length,
    lines: discrepancies,
  };
}

// Finalize: accept discrepancies and create adjustments
export async function finalizeCount(
  countId: number,
  data: {
    accepted_line_ids: number[];
    finalized_by: string;
  }
) {
  if (!data.finalized_by) {
    throw new Error('finalized_by is required');
  }

  const count = await db('cycle_counts').where('id', countId).first();
  if (!count) {
    throw new NotFoundError(`Cycle count with id ${countId} not found`);
  }
  if (count.status !== 'in_progress') {
    throw new Error('Count is already completed');
  }

  return db.transaction(async (trx) => {
    const allLines = await trx('cycle_count_lines')
      .where('cycle_count_id', countId)
      .select('*');

    // Check all lines counted
    const uncounted = allLines.filter((l: any) => l.counted_qty === null);
    if (uncounted.length > 0) {
      throw new Error(`${uncounted.length} lines have not been counted yet`);
    }

    const discrepancies = allLines.filter((l: any) => l.variance !== 0);
    const acceptedIds = new Set(data.accepted_line_ids.map(Number));
    let adjustmentsMade = 0;

    for (const line of discrepancies) {
      if (!acceptedIds.has(Number(line.id))) {
        continue;
      }

      // Read current product qty (may have changed since count started)
      const product = await trx('products')
        .where('id', line.product_id)
        .select('qty_on_hand')
        .first();

      if (!product) continue;

      const previousQty = product.qty_on_hand;
      // Adjust to match the counted quantity
      const qtyDelta = line.counted_qty - previousQty;

      if (qtyDelta === 0) {
        // No change needed — mark accepted without adjustment
        await trx('cycle_count_lines')
          .where('id', line.id)
          .update({ accepted: true, updated_at: trx.fn.now() });
        continue;
      }

      // Create adjustment record
      const [adjustment] = await trx('inventory_adjustments')
        .insert({
          product_id: line.product_id,
          previous_qty: previousQty,
          new_qty: line.counted_qty,
          qty_delta: qtyDelta,
          reason: 'count_correction',
          notes: `Cycle count #${countId}`,
          cycle_count_id: countId,
          adjusted_by: data.finalized_by,
        })
        .returning('*');

      // Apply through applyDelta
      await applyDelta({
        productId: Number(line.product_id),
        qtyDelta,
        eventType: InventoryEventType.CYCLE_COUNT_ADJUSTMENT,
        sourceTable: 'inventory_adjustments',
        sourceId: Number(adjustment.id),
        referenceCode: `COUNT-${countId}`,
        performedBy: data.finalized_by,
        trx,
      });

      // Link adjustment to count line
      await trx('cycle_count_lines')
        .where('id', line.id)
        .update({
          accepted: true,
          adjustment_id: adjustment.id,
          updated_at: trx.fn.now(),
        });

      adjustmentsMade++;
    }

    // Update count header
    await trx('cycle_counts')
      .where('id', countId)
      .update({
        status: 'completed',
        completed_at: trx.fn.now(),
        discrepancy_count: discrepancies.length,
        adjustments_made: adjustmentsMade,
      });

    return getCycleCountDetail(countId, trx);
  });
}
