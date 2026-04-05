import { Knex } from 'knex';

/**
 * Cost Service
 *
 * Manages weighted average cost (WAC) recalculation.
 *
 * CONSTRAINT: This service updates products.weighted_avg_cost only.
 * It NEVER modifies products.qty_on_hand. Quantity is owned by inventoryService.applyDelta().
 *
 * WAC formula (docs/prd.md § 3.5, § 7.2):
 *   new_wac = ((qty_on_hand * current_wac) + (receipt_qty * receipt_unit_cost))
 *             / (qty_on_hand + receipt_qty)
 *
 * Special cases:
 *   - qty_on_hand <= 0: WAC resets to receipt unit cost
 *   - Outbound actions do NOT recalculate WAC
 *
 * IMPORTANT: This must be called BEFORE applyDelta() in the receipt flow,
 * because the WAC formula uses the CURRENT qty_on_hand (before the receipt
 * increases it).
 */
export async function recalculateWAC(params: {
  productId: number;
  receiptQty: number;
  receiptUnitCost: number;
  trx: Knex.Transaction;
}): Promise<void> {
  const { productId, receiptQty, receiptUnitCost, trx } = params;

  const product = await trx('products')
    .where('id', productId)
    .select('qty_on_hand', 'weighted_avg_cost')
    .first();

  if (!product) {
    throw new Error(`Product with id ${productId} not found`);
  }

  let newWac: number;

  if (product.qty_on_hand <= 0) {
    // Reset WAC to receipt unit cost
    newWac = receiptUnitCost;
  } else {
    // Standard weighted average formula
    const currentValue = product.qty_on_hand * parseFloat(product.weighted_avg_cost);
    const incomingValue = receiptQty * receiptUnitCost;
    const totalQty = product.qty_on_hand + receiptQty;
    newWac = (currentValue + incomingValue) / totalQty;
  }

  await trx('products')
    .where('id', productId)
    .update({ weighted_avg_cost: newWac });
}
