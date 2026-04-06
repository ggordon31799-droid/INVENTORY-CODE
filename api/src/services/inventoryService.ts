import { ApplyDeltaParams } from '../types';

/**
 * CRITICAL INVARIANT
 * ==================
 * products.qty_on_hand must NEVER be updated directly by any module.
 * ALL inventory quantity changes MUST go through applyDelta().
 *
 * applyDelta() guarantees, within a single transaction:
 *   1. Lock the product row (SELECT FOR UPDATE)
 *   2. UPDATE products.qty_on_hand atomically
 *   3. INSERT a row into inventory_ledger recording the change
 *
 * If either write fails, the transaction rolls back.
 *
 * Concurrency safety: SELECT FOR UPDATE acquires a row-level lock that
 * blocks other transactions from reading or modifying the same row until
 * this transaction commits. This is sufficient — no updated_at comparison
 * is needed within the locked transaction.
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

  // 1. Lock the product row and read current qty
  const product = await trx('products')
    .where('id', productId)
    .select('id', 'qty_on_hand')
    .forUpdate()
    .first();

  if (!product) {
    throw new Error(`Product with id ${productId} not found`);
  }

  const newQty = product.qty_on_hand + qtyDelta;

  // 2. Atomic update — FOR UPDATE lock guarantees no concurrent modification
  await trx('products')
    .where('id', productId)
    .update({
      qty_on_hand: newQty,
      updated_at: trx.fn.now(),
    });

  // 3. Append to inventory_ledger (immutable audit trail)
  await trx('inventory_ledger').insert({
    product_id: productId,
    qty_delta: qtyDelta,
    qty_after: newQty,
    event_type: eventType,
    source_table: sourceTable,
    source_id: sourceId,
    reference_code: referenceCode ?? null,
    performed_by: performedBy,
  });
}
