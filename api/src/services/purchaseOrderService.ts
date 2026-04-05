/**
 * Purchase Order Service
 *
 * Manages PO lifecycle and receiving workflow.
 *
 * CONSTRAINT: Receiving increases inventory ONLY via inventoryService.applyDelta().
 * This service must never write to products.qty_on_hand directly.
 *
 * On confirmReceipt():
 *   1. Create receipt + receipt_line_items
 *   2. For each line: call inventoryService.applyDelta({
 *        eventType: RECEIPT,
 *        sourceTable: 'receipt_line_items',
 *        referenceCode: <PO number>,
 *      })
 *   3. For each line: call costService.recalculateWAC()
 *   4. Update PO status
 *   All within a single transaction.
 */

import { applyDelta } from './inventoryService';
import { InventoryEventType } from '../types';

export { applyDelta, InventoryEventType };

// TODO: implement PO CRUD (create, read, update, list)
// TODO: implement confirmReceipt() using applyDelta
// TODO: implement PO status transitions
