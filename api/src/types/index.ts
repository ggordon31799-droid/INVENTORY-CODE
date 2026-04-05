import { Knex } from 'knex';

/**
 * Every inventory ledger entry must declare its event type.
 * This enum is the exhaustive list of reasons inventory can change.
 */
export enum InventoryEventType {
  PO_RECEIPT = 'po_receipt',
  ORDER_SHIPMENT = 'order_shipment',
  MANUAL_OUTBOUND = 'manual_outbound',
  CYCLE_COUNT = 'cycle_count',
  ADJUSTMENT = 'adjustment',
}

/**
 * Parameters for inventoryService.applyDelta().
 * This is the ONLY interface through which qty_on_hand may change.
 */
export interface ApplyDeltaParams {
  productId: number;
  qtyDelta: number;
  eventType: InventoryEventType;
  sourceTable: string;
  sourceId: number;
  performedBy: number;
  trx: Knex.Transaction;
}
