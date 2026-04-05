/**
 * Inventory Action Service
 *
 * Manages manual outbound, cycle counts, adjustments, and transfers.
 *
 * CONSTRAINT: All quantity changes ONLY via inventoryService.applyDelta().
 * This service must never write to products.qty_on_hand directly.
 *
 * Manual Outbound types: Amazon FBA, Amazon Order, Damaged, Internal Use, Sample, Other
 *
 * On confirmOutbound():
 *   1. Create manual_outbound + manual_outbound_line_items
 *   2. For each line: call inventoryService.applyDelta({
 *        eventType: MANUAL_OUTBOUND,
 *        sourceTable: 'manual_outbound_line_items',
 *        referenceCode: <outbound type or reference>,
 *      })
 *   3. If type is Damaged: snapshot WAC to unit_cost_snapshot on line item
 *   All within a single transaction.
 *
 * On finalizeCycleCount():
 *   1. For each accepted discrepancy: create adjustment record
 *   2. For each adjustment: call inventoryService.applyDelta({
 *        eventType: CYCLE_COUNT_ADJUSTMENT,
 *        sourceTable: 'inventory_adjustments',
 *        referenceCode: <count ID>,
 *      })
 *   All within a single transaction.
 *
 * On confirmAdjustment():
 *   1. Create adjustment record
 *   2. Call inventoryService.applyDelta({
 *        eventType: ADJUSTMENT,
 *        sourceTable: 'inventory_adjustments',
 *      })
 *   All within a single transaction.
 */

import { applyDelta } from './inventoryService';
import { InventoryEventType } from '../types';

export { applyDelta, InventoryEventType };

// TODO: implement manual outbound (single + batch)
// TODO: implement cycle count workflow
// TODO: implement inventory adjustments
// TODO: implement transfers (location change only, no applyDelta needed)
