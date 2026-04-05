import { ApplyDeltaParams } from '../types';

/**
 * CRITICAL INVARIANT
 * ==================
 * products.qty_on_hand must NEVER be updated directly by any module.
 * ALL inventory quantity changes MUST go through applyDelta().
 *
 * applyDelta() guarantees, within a single transaction:
 *   1. UPDATE products.qty_on_hand by the given delta (with optimistic locking)
 *   2. INSERT a row into inventory_ledger recording the change
 *
 * If either write fails, the transaction rolls back.
 *
 * Callers MUST pass an active Knex transaction (trx). This ensures the
 * inventory update is atomic with the caller's own writes (e.g., creating
 * a receipt record and updating inventory in one transaction).
 *
 * Source: docs/database_schema.md § 1.1.1 Update Rule, § 3.17 inventory_ledger
 */
export async function applyDelta(params: ApplyDeltaParams): Promise<void> {
  const {
    productId,
    qtyDelta,
    eventType,
    sourceTable,
    sourceId,
    referenceCode,
    performedBy,
    trx,
  } = params;

  if (qtyDelta === 0) {
    return;
  }

  // TODO: Implement
  // 1. SELECT qty_on_hand, updated_at FROM products WHERE id = productId FOR UPDATE
  //    using trx
  // 2. UPDATE products SET qty_on_hand = qty_on_hand + qtyDelta, updated_at = now()
  //    WHERE id = productId AND updated_at = <read value> (optimistic lock)
  //    If zero rows updated, throw ConcurrencyConflictError
  // 3. INSERT INTO inventory_ledger (
  //      product_id, qty_delta, qty_after, event_type,
  //      source_table, source_id, reference_code, performed_by, created_at
  //    ) VALUES (
  //      productId, qtyDelta, <new qty_on_hand>, eventType,
  //      sourceTable, sourceId, referenceCode ?? null, performedBy, now()
  //    )
  //    using trx
  throw new Error('Not implemented');
}
