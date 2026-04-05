import { Knex } from 'knex';

/**
 * Every inventory ledger entry must declare its event type.
 * Values must match inventory_ledger.event_type VARCHAR(30) in the database.
 * Source: docs/database_schema.md § 3.17 inventory_ledger
 */
export enum InventoryEventType {
  RECEIPT = 'receipt',
  SHIPMENT = 'shipment',
  MANUAL_OUTBOUND = 'manual_outbound',
  ADJUSTMENT = 'adjustment',
  CYCLE_COUNT_ADJUSTMENT = 'cycle_count_adjustment',
}

/**
 * Parameters for inventoryService.applyDelta().
 * This is the ONLY interface through which products.qty_on_hand may change.
 *
 * Maps 1:1 to inventory_ledger columns (docs/database_schema.md § 3.17):
 *   productId     → product_id      BIGINT FK    (required)
 *   qtyDelta      → qty_delta       INTEGER      (required)
 *   eventType     → event_type      VARCHAR(30)  (required)
 *   sourceTable   → source_table    VARCHAR(50)  (required)
 *   sourceId      → source_id       BIGINT       (required)
 *   referenceCode → reference_code  VARCHAR(100) (optional — PO number, order number, count ID, etc.)
 *   performedBy   → performed_by    VARCHAR(100) (required — username)
 *   trx           → Knex transaction handle       (required — enforces atomicity)
 */
export interface ApplyDeltaParams {
  productId: number;
  qtyDelta: number;
  eventType: InventoryEventType;
  sourceTable: string;
  sourceId: number;
  referenceCode?: string;
  performedBy: string;
  trx: Knex.Transaction;
}
