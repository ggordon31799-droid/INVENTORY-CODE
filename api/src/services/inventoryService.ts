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

  // 1. Lock the product row and read current qty
  const product = await trx('products')
    .where('id', productId)
    .select('id', 'qty_on_hand', 'updated_at')
    .forUpdate()
    .first();

  if (!product) {
    throw new Error(`Product with id ${productId} not found`);
  }

  const newQty = product.qty_on_hand + qtyDelta;

  // 2. Optimistic lock update: check updated_at hasn't changed
  const updated = await trx('products')
    .where('id', productId)
    .where('updated_at', product.updated_at)
    .update({
      qty_on_hand: newQty,
      updated_at: trx.fn.now(),
    });

  if (updated === 0) {
    throw new Error('Concurrent modification detected on product — retry the operation');
  }

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
