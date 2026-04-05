**Database Schema Design**

Inventory Management System

Production-Ready Schema Specification

Version 1.0 | April 2026 | Companion to PRD v1.0

| Document Owner | TBD                                  |
|----------------|--------------------------------------|
| Status         | Draft                                |
| Last Updated   | April 4, 2026                        |
| Reference      | Inventory Management System PRD v1.0 |

# Table of Contents

# 1. Design Decisions

## 1.1 Inventory Quantity: Hybrid Stored + Ledger

The system uses a hybrid approach. A stored quantity field (qty_on_hand) lives on the products table for fast reads. Simultaneously, every inventory change writes a row to the inventory_ledger table. This dual-write design is chosen for the following reasons:

- Speed: Shipping workflows, Dashboard counts, and product lookups read a single integer column. There is no SUM() query on every page load. For a warehouse processing hundreds of SKUs per day, sub-millisecond reads on qty_on_hand are non-negotiable.

- Auditability: The ledger provides a complete, append-only history of every quantity change. Each ledger entry references its source record (receipt, shipment, adjustment, outbound, or count). The ledger can be independently summed per SKU and compared against qty_on_hand to detect drift.

- Reconciliation: A background or on-demand reconciliation process can compare SUM(ledger.qty_delta) per SKU against products.qty_on_hand. Any mismatch indicates a bug or data corruption and triggers an alert.

### 1.1.1 Update Rule

Every operation that changes inventory MUST, within a single database transaction: (1) INSERT a row into inventory_ledger, and (2) UPDATE products.qty_on_hand by the same delta. If either write fails, the transaction rolls back. There is no scenario where one updates without the other.

## 1.2 Cost Tracking: WAC with Receipt-Level History

Cost enters the system on PO line items (unit_cost). When inventory is received, the receipt_line_items table captures the unit_cost from the PO line. The products table stores weighted_avg_cost, which is recalculated on every receipt using the formula from the PRD. Historical cost is fully preserved: every receipt_line_item row records the exact unit cost paid at that point in time. No cost data is ever overwritten or deleted.

### 1.2.1 WAC Recalculation Logic

On receipt confirmation, for each SKU on the receipt:

1.  Read current qty_on_hand and weighted_avg_cost from products.

2.  If qty_on_hand <= 0: set weighted_avg_cost = receipt unit_cost.

3.  If qty_on_hand > 0: new_wac = ((qty_on_hand * weighted_avg_cost) + (receipt_qty * receipt_unit_cost)) / (qty_on_hand + receipt_qty).

4.  Update products.weighted_avg_cost and products.qty_on_hand in the same transaction.

## 1.3 Auditability: Inventory Ledger as Single Source of Truth

The inventory_ledger table is the audit backbone. Every row records: which SKU changed, by how much, why (event type), which source record caused it, and who did it. The ledger is append-only. Rows are never updated or deleted. Source records (receipts, shipments, adjustments, outbound records) provide full operational context; the ledger provides the unified chronological view across all event types.

## 1.4 Primary Key Strategy

All tables use auto-incrementing BIGINT primary keys (id). Human-readable identifiers (po_number, order_number, etc.) are stored as separate indexed columns. This separates internal referencing (foreign keys use id) from user-facing display (search and display use the human-readable field). UUIDs are avoided to keep indexes compact and joins fast.

## 1.5 Timestamp Convention

All timestamp columns use TIMESTAMPTZ (timestamp with time zone) and are stored in UTC. The application layer handles display timezone conversion. Every table with mutable rows includes both created_at and updated_at. Audit-critical tables (ledger, receipts, shipments) include only created_at since they are immutable.

## 1.6 Soft Delete Convention

No table supports hard deletion. Products use a status field (active/inactive). POs and orders use status lifecycles. Transactional records (receipts, shipments, ledger entries) are permanently immutable. This ensures referential integrity and audit completeness.

# 2. Entity-Relationship Overview

## 2.1 Table List

The schema consists of 18 tables organized into five domains:

### Product Domain

- products — SKU catalog, current quantity, WAC

- product_integration_mappings — eBay/WooCommerce SKU-to-internal-SKU links

### Inbound Domain

- purchase_orders — PO headers

- po_line_items — Ordered SKUs, quantities, unit costs

- receipts — Receipt headers (one per receive action)

- receipt_line_items — SKUs and quantities actually received

### Outbound Domain

- orders — Customer order headers (synced and manual)

- order_line_items — Ordered SKUs and quantities

- shipments — Shipment headers (one per ship action)

- shipment_line_items — SKUs and quantities shipped

- manual_outbound — Non-order outbound headers (FBA, damaged, samples, etc.)

- manual_outbound_line_items — SKUs and quantities removed

### Inventory Control Domain

- inventory_adjustments — Direct quantity changes with reason codes

- cycle_counts — Count session headers

- cycle_count_lines — Per-SKU count results

- transfers — Location change records

### Audit Domain

- inventory_ledger — Append-only log of every quantity change

## 2.2 Relationship Map (Text)

The following describes all foreign-key relationships. Arrows indicate the direction of the FK reference (child references parent).

> products (1) <-- (*) product_integration_mappings
>
> products (1) <-- (*) po_line_items
>
> products (1) <-- (*) order_line_items
>
> products (1) <-- (*) receipt_line_items
>
> products (1) <-- (*) shipment_line_items
>
> products (1) <-- (*) manual_outbound_line_items
>
> products (1) <-- (*) inventory_adjustments
>
> products (1) <-- (*) cycle_count_lines
>
> products (1) <-- (*) transfers
>
> products (1) <-- (*) inventory_ledger
>
> purchase_orders (1) <-- (*) po_line_items
>
> purchase_orders (1) <-- (*) receipts
>
> po_line_items (1) <-- (*) receipt_line_items
>
> receipts (1) <-- (*) receipt_line_items
>
> orders (1) <-- (*) order_line_items
>
> orders (1) <-- (*) shipments
>
> order_line_items (1) <-- (*) shipment_line_items
>
> shipments (1) <-- (*) shipment_line_items
>
> manual_outbound (1) <-- (*) manual_outbound_line_items
>
> cycle_counts (1) <-- (*) cycle_count_lines

# 3. Table Definitions

Each table is defined with all fields, data types, nullability, defaults, and descriptions. Primary keys are marked PK. Foreign keys are marked FK with the referenced table.

## 3.1 products

The central SKU catalog. Stores current stock level, cost, and location. This is the most frequently read table in the system.

| **Field**         | **Type**      | **Null** | **Default** | **Description**                                                  |
|-------------------|---------------|----------|-------------|------------------------------------------------------------------|
| id                | BIGINT PK     | No       | auto        | Internal unique identifier                                       |
| sku               | VARCHAR(50)   | No       |             | Unique internal SKU code. Immutable after creation.              |
| product_name      | VARCHAR(255)  | No       |             | Human-readable product name                                      |
| barcode           | VARCHAR(100)  | Yes      | NULL        | Scannable barcode value (UPC, EAN, custom). Unique if set.       |
| category          | VARCHAR(100)  | Yes      | NULL        | Product grouping (free text or constrained list)                 |
| qty_on_hand       | INTEGER       | No       | 0           | Current inventory quantity. Updated transactionally with ledger. |
| reorder_threshold | INTEGER       | No       | 0           | Low stock alert threshold. 0 = no alert.                         |
| location          | VARCHAR(100)  | Yes      | NULL        | Physical warehouse location                                      |
| weighted_avg_cost | DECIMAL(12,4) | No       | 0.0000      | Current weighted average unit cost                               |
| status            | VARCHAR(20)   | No       | 'active'    | active or inactive                                               |
| notes             | TEXT          | Yes      | NULL        | Free-text operational notes                                      |
| created_at        | TIMESTAMPTZ   | No       | NOW()       | Record creation timestamp                                        |
| updated_at        | TIMESTAMPTZ   | No       | NOW()       | Last modification timestamp                                      |

**Unique constraints:** sku; barcode (where not null).

**Computed (application-level):** total_value = qty_on_hand * weighted_avg_cost. Not stored; calculated on read.

## 3.2 product_integration_mappings

Maps external platform SKUs to internal SKUs. One internal SKU can have multiple mappings (e.g., one eBay listing and one WooCommerce product). Used during order import to match incoming line items.

| **Field**     | **Type**     | **Null** | **Default** | **Description**                                            |
|---------------|--------------|----------|-------------|------------------------------------------------------------|
| id            | BIGINT PK    | No       | auto        | Internal unique identifier                                 |
| product_id    | BIGINT FK    | No       |             | References products.id                                     |
| platform      | VARCHAR(20)  | No       |             | Platform name: 'ebay' or 'woocommerce'                     |
| external_sku  | VARCHAR(255) | No       |             | SKU or product ID as it appears on the external platform   |
| external_name | VARCHAR(255) | Yes      | NULL        | Product name as it appears on the platform (for reference) |
| created_at    | TIMESTAMPTZ  | No       | NOW()       | When this mapping was created                              |

**Unique constraint:** (platform, external_sku). One external SKU per platform maps to exactly one internal product.

## 3.3 purchase_orders

Header record for each purchase order placed with a supplier. Status is system-managed based on receipt activity.

| **Field**     | **Type**     | **Null** | **Default** | **Description**                                  |
|---------------|--------------|----------|-------------|--------------------------------------------------|
| id            | BIGINT PK    | No       | auto        | Internal unique identifier                       |
| po_number     | VARCHAR(50)  | No       |             | Human-readable PO number. Unique.                |
| supplier      | VARCHAR(255) | No       |             | Vendor name or identifier                        |
| status        | VARCHAR(30)  | No       | 'open'      | open, partially_received, fully_received, closed |
| expected_date | DATE         | Yes      | NULL        | Expected delivery date. Triggers overdue alert.  |
| notes         | TEXT         | Yes      | NULL        | Free-text notes                                  |
| created_at    | TIMESTAMPTZ  | No       | NOW()       | PO creation timestamp                            |
| updated_at    | TIMESTAMPTZ  | No       | NOW()       | Last modification timestamp                      |

**Unique constraint:** po_number.

## 3.4 po_line_items

Individual SKU lines on a purchase order. Each line specifies what was ordered, at what cost, and tracks how much has been received.

| **Field**         | **Type**      | **Null** | **Default** | **Description**                                                    |
|-------------------|---------------|----------|-------------|--------------------------------------------------------------------|
| id                | BIGINT PK     | No       | auto        | Internal unique identifier                                         |
| purchase_order_id | BIGINT FK     | No       |             | References purchase_orders.id                                      |
| product_id        | BIGINT FK     | No       |             | References products.id                                             |
| ordered_qty       | INTEGER       | No       |             | Quantity ordered from supplier                                     |
| unit_cost         | DECIMAL(12,4) | No       |             | Cost per unit for this line                                        |
| received_qty      | INTEGER       | No       | 0           | Total quantity received to date (denormalized, updated on receipt) |
| line_status       | VARCHAR(20)   | No       | 'open'      | open, partial, complete                                            |
| created_at        | TIMESTAMPTZ   | No       | NOW()       | Line creation timestamp                                            |
| updated_at        | TIMESTAMPTZ   | No       | NOW()       | Last modification timestamp                                        |

**Denormalization note:** received_qty is the sum of all receipt_line_items.received_qty for this PO line. It is updated transactionally on receipt confirmation to avoid aggregation queries on every PO view.

## 3.5 receipts

Header record created each time inventory is received against a purchase order. One PO can have multiple receipt records (partial receiving). Immutable after creation.

| **Field**         | **Type**     | **Null** | **Default** | **Description**                              |
|-------------------|--------------|----------|-------------|----------------------------------------------|
| id                | BIGINT PK    | No       | auto        | Internal unique identifier                   |
| purchase_order_id | BIGINT FK    | No       |             | References purchase_orders.id                |
| bol_number        | VARCHAR(100) | Yes      | NULL        | Bill of Lading reference                     |
| received_by       | VARCHAR(100) | No       |             | Username of the person who confirmed receipt |
| created_at        | TIMESTAMPTZ  | No       | NOW()       | Receipt confirmation timestamp               |

**Immutability:** No updated_at column. Receipts are never modified after creation.

## 3.6 receipt_line_items

Per-SKU quantities and costs on a receipt. Each line links to both the receipt and the originating PO line item. This is where cost history is permanently preserved.

| **Field**       | **Type**      | **Null** | **Default** | **Description**                                               |
|-----------------|---------------|----------|-------------|---------------------------------------------------------------|
| id              | BIGINT PK     | No       | auto        | Internal unique identifier                                    |
| receipt_id      | BIGINT FK     | No       |             | References receipts.id                                        |
| po_line_item_id | BIGINT FK     | No       |             | References po_line_items.id                                   |
| product_id      | BIGINT FK     | No       |             | References products.id (denormalized for query speed)         |
| received_qty    | INTEGER       | No       |             | Quantity received on this line                                |
| unit_cost       | DECIMAL(12,4) | No       |             | Unit cost copied from po_line_items.unit_cost at receipt time |
| created_at      | TIMESTAMPTZ   | No       | NOW()       | Line creation timestamp                                       |

**Cost history:** This table is the permanent record of what was paid. Even if the PO line cost is later corrected, the receipt_line_items row preserves the cost that was applied to inventory at the time of receipt.

## 3.7 orders

Customer order headers. Created by integration sync (eBay, WooCommerce) or manual entry. No inventory change occurs when an order is created.

| **Field**         | **Type**     | **Null** | **Default** | **Description**                                      |
|-------------------|--------------|----------|-------------|------------------------------------------------------|
| id                | BIGINT PK    | No       | auto        | Internal unique identifier                           |
| order_number      | VARCHAR(50)  | No       |             | Internal order number. Unique.                       |
| external_order_id | VARCHAR(100) | Yes      | NULL        | eBay or WooCommerce order reference                  |
| source            | VARCHAR(20)  | No       |             | 'ebay', 'woocommerce', or 'manual'                   |
| status            | VARCHAR(30)  | No       | 'pending'   | pending, partially_shipped, shipped, cancelled       |
| customer_name     | VARCHAR(255) | Yes      | NULL        | Buyer name                                           |
| order_date        | TIMESTAMPTZ  | Yes      | NULL        | Date order was placed on source platform             |
| import_date       | TIMESTAMPTZ  | No       | NOW()       | Date order entered this system                       |
| ship_date         | TIMESTAMPTZ  | Yes      | NULL        | Date order was fully shipped (set on final shipment) |
| notes             | TEXT         | Yes      | NULL        | Free-text notes                                      |
| created_at        | TIMESTAMPTZ  | No       | NOW()       | Record creation timestamp                            |
| updated_at        | TIMESTAMPTZ  | No       | NOW()       | Last modification timestamp                          |

**Unique constraints:** order_number; (source, external_order_id) where external_order_id is not null. Prevents duplicate import.

## 3.8 order_line_items

SKUs and quantities on a customer order. Lines may arrive with unmatched external SKUs; these are stored and flagged until resolved.

| **Field**             | **Type**     | **Null** | **Default** | **Description**                                            |
|-----------------------|--------------|----------|-------------|------------------------------------------------------------|
| id                    | BIGINT PK    | No       | auto        | Internal unique identifier                                 |
| order_id              | BIGINT FK    | No       |             | References orders.id                                       |
| product_id            | BIGINT FK    | Yes      | NULL        | References products.id. NULL if SKU is unmatched.          |
| external_sku          | VARCHAR(255) | Yes      | NULL        | SKU as received from integration (for mapping reference)   |
| product_name_external | VARCHAR(255) | Yes      | NULL        | Item name from integration (display fallback if unmatched) |
| ordered_qty           | INTEGER      | No       |             | Quantity ordered by customer                               |
| shipped_qty           | INTEGER      | No       | 0           | Total quantity shipped to date (denormalized)              |
| line_status           | VARCHAR(20)  | No       | 'pending'   | pending, partial, complete                                 |
| is_matched            | BOOLEAN      | No       | true        | False if product_id is NULL (unmatched SKU)                |
| created_at            | TIMESTAMPTZ  | No       | NOW()       | Line creation timestamp                                    |
| updated_at            | TIMESTAMPTZ  | No       | NOW()       | Last modification timestamp                                |

**Unmatched SKU handling:** When product_id is NULL and is_matched is false, the order cannot be shipped. Resolving the SKU sets product_id and flips is_matched to true.

## 3.9 shipments

Header record created each time an order is shipped (fully or partially). One order can have multiple shipment records. Immutable after creation. This is the event that triggers inventory deduction.

| **Field**       | **Type**     | **Null** | **Default** | **Description**                                                  |
|-----------------|--------------|----------|-------------|------------------------------------------------------------------|
| id              | BIGINT PK    | No       | auto        | Internal unique identifier                                       |
| order_id        | BIGINT FK    | No       |             | References orders.id                                             |
| tracking_number | VARCHAR(255) | Yes      | NULL        | Carrier tracking reference                                       |
| batch_id        | VARCHAR(50)  | Yes      | NULL        | Batch identifier if created via Batch Ship. NULL for individual. |
| shipped_by      | VARCHAR(100) | No       |             | Username of the person who confirmed shipment                    |
| created_at      | TIMESTAMPTZ  | No       | NOW()       | Shipment confirmation timestamp                                  |

**Immutability:** No updated_at. Shipments are never modified. Errors are corrected via inventory_adjustments.

## 3.10 shipment_line_items

Per-SKU quantities on a shipment. Links to both the shipment and the originating order line.

| **Field**          | **Type**    | **Null** | **Default** | **Description**                                       |
|--------------------|-------------|----------|-------------|-------------------------------------------------------|
| id                 | BIGINT PK   | No       | auto        | Internal unique identifier                            |
| shipment_id        | BIGINT FK   | No       |             | References shipments.id                               |
| order_line_item_id | BIGINT FK   | No       |             | References order_line_items.id                        |
| product_id         | BIGINT FK   | No       |             | References products.id (denormalized for query speed) |
| shipped_qty        | INTEGER     | No       |             | Quantity shipped on this line                         |
| created_at         | TIMESTAMPTZ | No       | NOW()       | Line creation timestamp                               |

## 3.11 manual_outbound

Header for non-order inventory removals: FBA shipments, Amazon manual orders, damaged, internal use, and samples. Supports single-SKU and multi-SKU (batch) outbound. Immutable after creation.

| **Field**        | **Type**     | **Null** | **Default** | **Description**                                                |
|------------------|--------------|----------|-------------|----------------------------------------------------------------|
| id               | BIGINT PK    | No       | auto        | Internal unique identifier                                     |
| outbound_type    | VARCHAR(30)  | No       |             | amazon_fba, amazon_order, damaged, internal_use, sample, other |
| reason_text      | VARCHAR(255) | Yes      | NULL        | Free-text reason (used when type is 'other')                   |
| reference_number | VARCHAR(100) | Yes      | NULL        | Optional external reference (e.g., FBA shipment ID)            |
| created_by       | VARCHAR(100) | No       |             | Username of the person who confirmed outbound                  |
| created_at       | TIMESTAMPTZ  | No       | NOW()       | Outbound confirmation timestamp                                |

## 3.12 manual_outbound_line_items

Per-SKU quantities and cost snapshots on a manual outbound record. For damaged outbound, the unit_cost_snapshot captures WAC at removal time for supplier credit tracking.

| **Field**          | **Type**      | **Null** | **Default** | **Description**                                                                       |
|--------------------|---------------|----------|-------------|---------------------------------------------------------------------------------------|
| id                 | BIGINT PK     | No       | auto        | Internal unique identifier                                                            |
| manual_outbound_id | BIGINT FK     | No       |             | References manual_outbound.id                                                         |
| product_id         | BIGINT FK     | No       |             | References products.id                                                                |
| qty                | INTEGER       | No       |             | Quantity removed                                                                      |
| unit_cost_snapshot | DECIMAL(12,4) | Yes      | NULL        | WAC at time of removal. Required when outbound_type is 'damaged'; optional otherwise. |
| created_at         | TIMESTAMPTZ   | No       | NOW()       | Line creation timestamp                                                               |

**Damaged value query:** SELECT product_id, SUM(qty * unit_cost_snapshot) FROM manual_outbound_line_items JOIN manual_outbound ON ... WHERE outbound_type = 'damaged' GROUP BY product_id.

## 3.13 inventory_adjustments

Direct inventory quantity changes with documented reasons. Created standalone or linked to a cycle count. Immutable after creation.

| **Field**      | **Type**     | **Null** | **Default** | **Description**                                                                    |
|----------------|--------------|----------|-------------|------------------------------------------------------------------------------------|
| id             | BIGINT PK    | No       | auto        | Internal unique identifier                                                         |
| product_id     | BIGINT FK    | No       |             | References products.id                                                             |
| previous_qty   | INTEGER      | No       |             | Quantity before adjustment (snapshot)                                              |
| new_qty        | INTEGER      | No       |             | Quantity after adjustment                                                          |
| qty_delta      | INTEGER      | No       |             | Change amount (positive or negative)                                               |
| reason         | VARCHAR(30)  | No       |             | count_correction, write_off, found_inventory, shipment_correction, data_fix, other |
| notes          | TEXT         | Yes      | NULL        | Free-text notes (should reference shipment ID for corrections)                     |
| cycle_count_id | BIGINT FK    | Yes      | NULL        | References cycle_counts.id if originated from a count                              |
| adjusted_by    | VARCHAR(100) | No       |             | Username of the person who confirmed adjustment                                    |
| created_at     | TIMESTAMPTZ  | No       | NOW()       | Adjustment timestamp                                                               |

**Shipment correction pattern:** reason = 'shipment_correction', notes contains the shipment ID being corrected. Filterable for correction reports.

## 3.14 cycle_counts

Header record for a physical inventory count session. Tracks the overall count status and results.

| **Field**         | **Type**     | **Null** | **Default**   | **Description**                                             |
|-------------------|--------------|----------|---------------|-------------------------------------------------------------|
| id                | BIGINT PK    | No       | auto          | Internal unique identifier                                  |
| status            | VARCHAR(20)  | No       | 'in_progress' | in_progress, completed                                      |
| scope_type        | VARCHAR(30)  | Yes      | NULL          | all, category, location, or custom (how SKUs were selected) |
| scope_value       | VARCHAR(255) | Yes      | NULL          | The category name, location, or null for all/custom         |
| total_skus        | INTEGER      | No       | 0             | Number of SKUs included in count                            |
| discrepancy_count | INTEGER      | No       | 0             | Number of SKUs with variance (set on completion)            |
| adjustments_made  | INTEGER      | No       | 0             | Number of adjustments accepted and applied                  |
| counted_by        | VARCHAR(100) | No       |               | Username of the person performing the count                 |
| created_at        | TIMESTAMPTZ  | No       | NOW()         | Count start timestamp                                       |
| completed_at      | TIMESTAMPTZ  | Yes      | NULL          | Count finalization timestamp                                |

## 3.15 cycle_count_lines

Per-SKU count results. Stores the system quantity at count time and the physical count entered by the user. Variance is calculated.

| **Field**      | **Type**    | **Null** | **Default** | **Description**                                               |
|----------------|-------------|----------|-------------|---------------------------------------------------------------|
| id             | BIGINT PK   | No       | auto        | Internal unique identifier                                    |
| cycle_count_id | BIGINT FK   | No       |             | References cycle_counts.id                                    |
| product_id     | BIGINT FK   | No       |             | References products.id                                        |
| system_qty     | INTEGER     | No       |             | qty_on_hand at the time the count was initiated               |
| counted_qty    | INTEGER     | Yes      | NULL        | Physical count entered by user. NULL if not yet counted.      |
| variance       | INTEGER     | Yes      | NULL        | counted_qty - system_qty. Calculated on entry.                |
| accepted       | BOOLEAN     | No       | false       | True if user accepted the variance and adjustment was created |
| adjustment_id  | BIGINT FK   | Yes      | NULL        | References inventory_adjustments.id if accepted               |
| created_at     | TIMESTAMPTZ | No       | NOW()       | Line creation timestamp                                       |
| updated_at     | TIMESTAMPTZ | No       | NOW()       | Last modification timestamp                                   |

## 3.16 transfers

Records of inventory location changes. Does not affect quantity. Immutable after creation.

| **Field**      | **Type**     | **Null** | **Default** | **Description**                                      |
|----------------|--------------|----------|-------------|------------------------------------------------------|
| id             | BIGINT PK    | No       | auto        | Internal unique identifier                           |
| product_id     | BIGINT FK    | No       |             | References products.id                               |
| from_location  | VARCHAR(100) | Yes      | NULL        | Previous location (NULL if no location was assigned) |
| to_location    | VARCHAR(100) | No       |             | New location                                         |
| transferred_by | VARCHAR(100) | No       |             | Username of the person who confirmed transfer        |
| created_at     | TIMESTAMPTZ  | No       | NOW()       | Transfer timestamp                                   |

## 3.17 inventory_ledger

Append-only audit log of every inventory quantity change in the system. This is the most critical table for auditability and reconciliation. No UPDATE or DELETE operations are ever performed on this table.

| **Field**      | **Type**     | **Null** | **Default** | **Description**                                                        |
|----------------|--------------|----------|-------------|------------------------------------------------------------------------|
| id             | BIGINT PK    | No       | auto        | Internal unique identifier (monotonically increasing)                  |
| product_id     | BIGINT FK    | No       |             | References products.id                                                 |
| qty_delta      | INTEGER      | No       |             | Change amount (positive = increase, negative = decrease)               |
| qty_after      | INTEGER      | No       |             | qty_on_hand after this change (for point-in-time queries)              |
| event_type     | VARCHAR(30)  | No       |             | receipt, shipment, manual_outbound, adjustment, cycle_count_adjustment |
| source_table   | VARCHAR(50)  | No       |             | Table name of the source record (e.g., 'receipt_line_items')           |
| source_id      | BIGINT       | No       |             | Primary key of the source record in source_table                       |
| reference_code | VARCHAR(100) | Yes      | NULL        | Human-readable ref: PO number, order number, count ID, etc.            |
| performed_by   | VARCHAR(100) | No       |             | Username of the person who triggered the change                        |
| created_at     | TIMESTAMPTZ  | No       | NOW()       | Event timestamp                                                        |

**Reconciliation query:** SELECT product_id, SUM(qty_delta) as ledger_total FROM inventory_ledger GROUP BY product_id. Compare ledger_total against products.qty_on_hand for each SKU.

**Activity feed query:** SELECT * FROM inventory_ledger ORDER BY created_at DESC LIMIT 25. This powers the Dashboard recent activity feed and the global activity log.

# 4. Transaction Flows

This section defines exactly which tables are written, in what order, within a single database transaction for each inventory-affecting operation. Every flow is atomic: all writes succeed or all roll back.

## 4.1 PO Receipt Confirmation

Triggered when user clicks Confirm Receipt on a purchase order.

1.  INSERT into receipts (purchase_order_id, bol_number, received_by).

2.  For each line item received: INSERT into receipt_line_items (receipt_id, po_line_item_id, product_id, received_qty, unit_cost).

3.  For each line item: UPDATE po_line_items SET received_qty = received_qty + :received_qty, update line_status.

4.  UPDATE purchase_orders.status based on whether all lines are complete.

5.  For each product: recalculate weighted_avg_cost. UPDATE products SET qty_on_hand = qty_on_hand + :received_qty, weighted_avg_cost = :new_wac.

6.  For each product: INSERT into inventory_ledger (product_id, qty_delta = +received_qty, event_type = 'receipt', source_table = 'receipt_line_items', source_id).

**Writes:** receipts (1), receipt_line_items (N), po_line_items (N), purchase_orders (1), products (N), inventory_ledger (N).

## 4.2 Order Shipment Confirmation

Triggered when user clicks Confirm Shipment on an order (standard, next-order, or scan-to-ship).

1.  INSERT into shipments (order_id, tracking_number, batch_id, shipped_by).

2.  For each line item shipped: INSERT into shipment_line_items (shipment_id, order_line_item_id, product_id, shipped_qty).

3.  For each order line: UPDATE order_line_items SET shipped_qty = shipped_qty + :shipped_qty, update line_status.

4.  UPDATE orders.status and orders.ship_date based on whether all lines are complete.

5.  For each product: UPDATE products SET qty_on_hand = qty_on_hand - :shipped_qty.

6.  For each product: INSERT into inventory_ledger (product_id, qty_delta = -shipped_qty, event_type = 'shipment', source_table = 'shipment_line_items', source_id).

**Writes:** shipments (1), shipment_line_items (N), order_line_items (N), orders (1), products (N), inventory_ledger (N).

## 4.3 Batch Shipment

Triggered when user clicks Confirm Batch for multiple selected orders. Executes Transaction 4.2 for each order within a single wrapping transaction. A batch_id is generated and stored on all shipment records in the batch. If any individual order fails (e.g., constraint violation), the entire batch rolls back.

## 4.4 Manual Outbound Confirmation

1.  INSERT into manual_outbound (outbound_type, reason_text, reference_number, created_by).

2.  For each line: INSERT into manual_outbound_line_items (manual_outbound_id, product_id, qty, unit_cost_snapshot).

3.  For each product: UPDATE products SET qty_on_hand = qty_on_hand - :qty.

4.  For each product: INSERT into inventory_ledger (product_id, qty_delta = -qty, event_type = 'manual_outbound', source_table = 'manual_outbound_line_items', source_id).

## 4.5 Inventory Adjustment Confirmation

1.  INSERT into inventory_adjustments (product_id, previous_qty, new_qty, qty_delta, reason, notes, cycle_count_id, adjusted_by).

2.  UPDATE products SET qty_on_hand = :new_qty.

3.  INSERT into inventory_ledger (product_id, qty_delta, event_type = 'adjustment', source_table = 'inventory_adjustments', source_id).

## 4.6 Cycle Count Finalization

For each accepted discrepancy on the count, executes Transaction 4.5 within the same wrapping transaction. The resulting adjustment records are linked to the cycle count via cycle_count_id. Updates cycle_counts.status, completed_at, discrepancy_count, and adjustments_made.

## 4.7 Transfer Confirmation

1.  INSERT into transfers (product_id, from_location, to_location, transferred_by).

2.  UPDATE products SET location = :to_location.

No inventory_ledger entry is created because quantity does not change. The transfers table itself serves as the audit trail for location changes.

# 5. Indexing Strategy

Indexes are designed to support the high-frequency queries identified in the PRD: SKU lookup, order search, shipment workflows, dashboard aggregations, and ledger queries. Over-indexing is avoided; each index maps to a real query pattern.

## 5.1 Primary Indexes (Created by PK)

Every table has a clustered index on id (BIGINT primary key). These support all foreign key joins.

## 5.2 Unique Indexes

| **Table**                    | **Columns**                                                     | **Purpose**                             |
|------------------------------|-----------------------------------------------------------------|-----------------------------------------|
| products                     | sku                                                             | Fast SKU lookup, enforce uniqueness     |
| products                     | barcode (WHERE NOT NULL)                                        | Barcode scan lookup, enforce uniqueness |
| purchase_orders              | po_number                                                       | PO number lookup, enforce uniqueness    |
| orders                       | order_number                                                    | Order number lookup                     |
| orders                       | (source, external_order_id) WHERE external_order_id IS NOT NULL | Duplicate import prevention             |
| product_integration_mappings | (platform, external_sku)                                        | One mapping per platform SKU            |

## 5.3 Query-Driven Indexes

| **Table.Column(s)**                       | **Query Pattern**                                                   | **Type**                     |
|-------------------------------------------|---------------------------------------------------------------------|------------------------------|
| products.status                           | Filter active products in list views                                | B-tree                       |
| products.category                         | Filter products by category                                         | B-tree                       |
| products.location                         | Filter products by location (cycle counts)                          | B-tree                       |
| orders.status                             | Today's Work queue: WHERE status IN ('pending','partially_shipped') | B-tree                       |
| orders.order_date                         | Sort orders oldest-first in shipping queue                          | B-tree                       |
| orders.(status, order_date)               | Composite for sorted pending order queries                          | B-tree                       |
| order_line_items.order_id                 | Load lines for an order                                             | B-tree                       |
| order_line_items.product_id               | Scan-to-Ship: find pending orders by SKU                            | B-tree                       |
| order_line_items.is_matched               | Dashboard alert: unmatched SKUs                                     | B-tree partial (WHERE false) |
| purchase_orders.status                    | Filter open POs                                                     | B-tree                       |
| purchase_orders.expected_date             | Overdue PO alert query                                              | B-tree                       |
| po_line_items.purchase_order_id           | Load lines for a PO                                                 | B-tree                       |
| inventory_ledger.product_id               | Per-SKU ledger history and reconciliation                           | B-tree                       |
| inventory_ledger.created_at               | Activity feed (ORDER BY created_at DESC)                            | B-tree                       |
| inventory_ledger.(product_id, created_at) | Composite for SKU-scoped history                                    | B-tree                       |
| inventory_ledger.event_type               | Filter ledger by event type                                         | B-tree                       |
| shipment_line_items.shipment_id           | Load lines for a shipment                                           | B-tree                       |
| receipt_line_items.receipt_id             | Load lines for a receipt                                            | B-tree                       |
| receipt_line_items.product_id             | Cost history per SKU                                                | B-tree                       |
| inventory_adjustments.reason              | Filter corrections report                                           | B-tree                       |
| inventory_adjustments.product_id          | Adjustment history per SKU                                          | B-tree                       |
| manual_outbound_line_items.product_id     | Damaged report per SKU                                              | B-tree                       |
| product_integration_mappings.product_id   | Load all mappings for a product                                     | B-tree                       |

## 5.4 Index Maintenance Notes

- The inventory_ledger table grows indefinitely. The (product_id, created_at) composite index is critical for preventing full table scans on per-SKU history views. As the table grows past millions of rows, table partitioning by created_at (monthly or quarterly) should be considered.

- The orders.(status, order_date) composite index directly supports the Today’s Work query and Scan-to-Ship SKU matching. These are the highest-frequency queries during active shipping operations.

- Partial indexes (e.g., WHERE is_matched = false) are used where the filtered set is small relative to the full table, keeping index size minimal.

# 6. Concurrency and Data Integrity

## 6.1 Optimistic Locking on products

The products table includes updated_at for optimistic locking. When a transaction reads qty_on_hand and weighted_avg_cost for an update, it stores the current updated_at value. The UPDATE statement includes WHERE updated_at = :read_updated_at. If another transaction modified the row between read and write, the WHERE clause matches zero rows, the application detects the conflict, and retries the transaction. This prevents two simultaneous shipments from reading the same qty_on_hand and both decrementing from the same starting value.

## 6.2 Transaction Isolation

All inventory-affecting transactions should run at READ COMMITTED isolation level (PostgreSQL default). Combined with optimistic locking on the products row, this provides sufficient consistency without the performance penalty of SERIALIZABLE. The optimistic lock on products.updated_at is the serialization point for quantity changes.

## 6.3 Batch Shipment Atomicity

A batch shipment wraps all individual order shipments in a single transaction. If any order in the batch fails (e.g., an optimistic lock conflict on a product row), the entire batch rolls back. The user is notified of the conflict and can retry. This prevents partial batch processing where some orders ship and others silently fail.

## 6.4 Foreign Key Enforcement

All foreign keys are enforced at the database level with ON DELETE RESTRICT. No cascading deletes. Since no records are ever deleted (soft-delete model), this constraint is a safety net against application-level bugs.

# 7. Integration SKU Mapping

## 7.1 Mapping Table Design

The product_integration_mappings table implements a many-to-one relationship: multiple external SKUs can map to one internal product, but each external SKU on a given platform maps to exactly one product (enforced by the unique constraint on (platform, external_sku)).

## 7.2 Order Import Matching Algorithm

1.  For each line item in the incoming order, read the external SKU from the platform API response.

2.  Query: SELECT product_id FROM product_integration_mappings WHERE platform = :platform AND external_sku = :external_sku.

3.  If a row is returned: set order_line_items.product_id to the matched product_id, set is_matched = true.

4.  If no row is returned: set order_line_items.product_id = NULL, set is_matched = false, store the external_sku and external product name on the line item for display.

## 7.3 SKU Resolution Workflow (Data)

When a user resolves an unmatched SKU from the order detail view:

1.  User selects an internal product.

2.  System updates order_line_items SET product_id = :selected, is_matched = true.

3.  If the user elects to save the mapping: INSERT into product_integration_mappings (product_id, platform, external_sku).

4.  Future imports with the same (platform, external_sku) auto-match.

## 7.4 Multi-Platform Product Example

A single product (SKU: BOX-12x12x6) might have these mappings:

| **platform** | **external_sku**  | **product_id** |
|--------------|-------------------|----------------|
| ebay         | 292847501234      | 42             |
| ebay         | 292847509876      | 42             |
| woocommerce  | box-12x12x6-kraft | 42             |

Two different eBay listings and one WooCommerce product all resolve to the same internal product.

# 8. Cost Tracking Architecture

## 8.1 Where Cost Data Lives

| **Location**               | **Field**          | **Purpose**                                        |
|----------------------------|--------------------|----------------------------------------------------|
| po_line_items              | unit_cost          | Cost committed at ordering time                    |
| receipt_line_items         | unit_cost          | Cost applied at receiving time (permanent history) |
| products                   | weighted_avg_cost  | Current blended cost for valuation                 |
| manual_outbound_line_items | unit_cost_snapshot | WAC at time of damaged removal (for credit claims) |

## 8.2 Cost History Query

To view the full cost history for a SKU: SELECT rli.unit_cost, rli.received_qty, rli.created_at, r.bol_number, po.po_number FROM receipt_line_items rli JOIN receipts r ON rli.receipt_id = r.id JOIN purchase_orders po ON r.purchase_order_id = po.id WHERE rli.product_id = :product_id ORDER BY rli.created_at. This returns every price point at which the SKU was received, when, on which PO, and with which BOL.

## 8.3 WAC After Outbound

Outbound events (shipments, manual outbound, negative adjustments) reduce qty_on_hand but do not change weighted_avg_cost. The value removed from inventory is calculated as qty_removed * weighted_avg_cost at the application level for display purposes only. The WAC itself changes only on inbound receipt events.

## 8.4 Edge Case: WAC Reset on Zero/Negative Inventory

If qty_on_hand reaches zero or goes negative, the WAC is stale (it reflects the last blended cost). On the next receipt, the WAC resets entirely to the new receipt unit_cost, because the formula denominator (existing qty + receipt qty) effectively starts fresh. This is the correct behavior: there is no existing inventory to blend with.

# 9. Schema Summary

## 9.1 Table Count

Total: 17 tables. 6 header tables, 7 line-item tables, 2 control tables, 1 ledger table, 1 mapping table.

## 9.2 Row Growth Estimates

Growth projections assume the business processes approximately 200 SKUs per day across receiving, shipping, and adjustments.

| **Table**             | **Growth Rate**                           | **Est. Rows / Year** |
|-----------------------|-------------------------------------------|----------------------|
| products              | Slow (new SKUs added occasionally)        | 500 – 2,000          |
| inventory_ledger      | Highest (1 row per qty change event)      | 50,000 – 100,000     |
| order_line_items      | High (1+ per order)                       | 30,000 – 80,000      |
| orders                | High (daily order sync)                   | 20,000 – 50,000      |
| shipment_line_items   | High (matches orders)                     | 30,000 – 80,000      |
| receipt_line_items    | Moderate (depends on PO frequency)        | 5,000 – 15,000       |
| inventory_adjustments | Low (corrections and counts)              | 1,000 – 5,000        |
| cycle_count_lines     | Low-Moderate (depends on count frequency) | 2,000 – 10,000       |
| transfers             | Low                                       | 500 – 2,000          |

At these volumes, no table will exceed single-digit millions of rows within 5 years. Standard B-tree indexing is sufficient. Partitioning of inventory_ledger by date should be evaluated if the business scales significantly or if ledger queries degrade.

# 10. Key Design Decisions Summary

| **Decision**                                            | **Rationale**                                                                            |
|---------------------------------------------------------|------------------------------------------------------------------------------------------|
| Hybrid stored qty + ledger                              | Fast reads for shipping workflows; full auditability for reconciliation and debugging    |
| Immutable receipt/shipment/ledger records               | Corrections via adjustments preserve history; no data is ever silently overwritten       |
| Denormalized received_qty and shipped_qty on line items | Eliminates SUM() aggregation on every PO/order view; kept in sync transactionally        |
| BIGINT auto-increment PKs                               | Compact indexes, fast joins; no UUID overhead for a single-tenant system                 |
| Separate header + line item tables (not JSONB)          | Relational foreign keys enable ledger traceability; line-level queries are indexable     |
| product_id denormalized on receipt/shipment line items  | Avoids extra joins through PO/order lines for SKU-scoped queries (cost history, ledger)  |
| qty_after on inventory_ledger                           | Enables point-in-time quantity reconstruction without re-summing the entire ledger       |
| Optimistic locking via updated_at                       | Prevents concurrent shipments from double-decrementing; lightweight vs. row-level locks  |
| Partial index on is_matched = false                     | Dashboard unmatched-SKU alert is a tiny filtered set; no need to index all order lines   |
| No hard deletes anywhere                                | Referential integrity guaranteed; audit trail never broken; simplifies application logic |
| batch_id on shipments                                   | Links all shipments from a Batch Ship action for reporting and error tracing             |
| unit_cost_snapshot nullable on outbound lines           | Only required for damaged type; avoids wasted storage on other outbound types            |
