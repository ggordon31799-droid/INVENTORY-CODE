/**
 * Order Service
 *
 * Manages outbound order lifecycle and shipment workflow.
 *
 * CONSTRAINT: Shipment decreases inventory ONLY via inventoryService.applyDelta().
 * This service must never write to products.qty_on_hand directly.
 *
 * On confirmShipment():
 *   1. Create shipment + shipment_line_items
 *   2. For each line: call inventoryService.applyDelta({
 *        eventType: SHIPMENT,
 *        sourceTable: 'shipment_line_items',
 *        referenceCode: <order number>,
 *      })
 *   3. Update order status
 *   All within a single transaction.
 */

import { applyDelta } from './inventoryService';
import { InventoryEventType } from '../types';

export { applyDelta, InventoryEventType };

// TODO: implement order CRUD (create, read, list)
// TODO: implement confirmShipment() using applyDelta
// TODO: implement batchShip() using applyDelta
// TODO: implement order sync import (eBay, WooCommerce)
// TODO: implement order cancellation
