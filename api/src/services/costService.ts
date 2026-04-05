/**
 * Cost Service
 *
 * Manages weighted average cost (WAC) recalculation.
 *
 * CONSTRAINT: This service updates products.weighted_avg_cost only.
 * It NEVER modifies products.qty_on_hand. Quantity is owned by inventoryService.applyDelta().
 *
 * WAC formula:
 *   new_wac = ((qty_on_hand * current_wac) + (receipt_qty * receipt_unit_cost))
 *             / (qty_on_hand + receipt_qty)
 *
 * Special cases:
 *   - qty_on_hand <= 0: WAC resets to receipt unit cost
 *   - Outbound actions do NOT recalculate WAC
 */

// TODO: implement recalculateWAC() called by purchaseOrderService on receipt
