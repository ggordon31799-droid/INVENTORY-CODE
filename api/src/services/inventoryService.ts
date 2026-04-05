/**
 * Single entry point for ALL inventory quantity changes.
 * Every operation that changes inventory MUST go through this function.
 * It atomically updates products.qty_on_hand and inserts an inventory_ledger row.
 */
export async function applyDelta(params: {
  productId: number;
  qtyDelta: number;
  eventType: string;
  sourceTable: string;
  sourceId: number;
  performedBy: number;
  trx?: any; // Knex transaction
}): Promise<void> {
  // TODO: Implement atomic inventory update
  // 1. UPDATE products.qty_on_hand += qtyDelta (with optimistic locking)
  // 2. INSERT inventory_ledger row
  // Both in single transaction; rollback on failure
  throw new Error('Not implemented');
}
