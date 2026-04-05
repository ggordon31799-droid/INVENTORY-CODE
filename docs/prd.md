**Product Requirements Document**

Inventory Management System

Cardboard Shipping Box Operations

Version 1.0 | April 2026 | Confidential

| Document Owner | TBD                                    |
|----------------|----------------------------------------|
| Status         | Draft                                  |
| Last Updated   | April 4, 2026                          |
| Audience       | Development Team, Project Stakeholders |

# Table of Contents

[Table of Contents](#table-of-contents)

[1. System Overview](#system-overview)

[1.1 Purpose](#purpose)

[1.2 Problem Statement](#problem-statement)

[1.3 Core Design Principle](#core-design-principle)

[1.4 Design Constraints](#design-constraints)

[1.5 System Modules](#system-modules)

[1.6 User Model](#user-model)

[2. Dashboard Module](#dashboard-module)

[2.1 Purpose](#purpose-1)

[2.2 Dashboard Sections](#dashboard-sections)

[2.2.1 Alerts Panel](#alerts-panel)

[2.2.2 Pending Actions Panel](#pending-actions-panel)

[2.2.3 Inventory Summary Panel](#inventory-summary-panel)

[2.2.4 Recent Activity Feed](#recent-activity-feed)

[2.3 Today’s Work View [ADDED]](#todays-work-view-added)

[2.3.1 Purpose](#purpose-2)

[2.3.2 Content](#content)

[2.3.3 Interaction](#interaction)

[3. Products Module](#products-module)

[3.1 Purpose](#purpose-3)

[3.2 Product Record Fields](#product-record-fields)

[3.3 Product List View](#product-list-view)

[3.4 Integration SKU Mapping](#integration-sku-mapping)

[3.5 Weighted Average Cost Calculation](#weighted-average-cost-calculation)

[4. Purchase Orders Module](#purchase-orders-module)

[4.1 Purpose](#purpose-4)

[4.2 Purchase Order Record Fields](#purchase-order-record-fields)

[4.3 Purchase Order Line Items](#purchase-order-line-items)

[4.4 Purchase Order Statuses](#purchase-order-statuses)

[4.5 Receiving Workflow](#receiving-workflow)

[4.5.1 Standard Receiving Flow](#standard-receiving-flow)

[4.5.2 Partial Receiving](#partial-receiving)

[4.5.3 Over-Receiving](#over-receiving)

[4.5.4 Receipt Record](#receipt-record)

[5. Orders Module](#orders-module)

[5.1 Purpose](#purpose-5)

[5.2 Order Record Fields](#order-record-fields)

[5.3 Order Line Items](#order-line-items)

[5.4 Order Statuses](#order-statuses)

[5.5 Order Sync (eBay and WooCommerce)](#order-sync-ebay-and-woocommerce)

[5.5.1 Sync Mechanism](#sync-mechanism)

[5.5.2 SKU Matching on Import](#sku-matching-on-import)

[5.5.3 Resolving Unmatched SKUs](#resolving-unmatched-skus)

[5.6 Manual Order Entry [MODIFIED]](#manual-order-entry-modified)

[5.6.1 Optimized Multi-Line Entry](#optimized-multi-line-entry)

[5.6.2 Quick Ship Option](#quick-ship-option)

[5.7 Shipment Confirmation Workflow](#shipment-confirmation-workflow)

[5.7.1 Standard Ship Flow](#standard-ship-flow)

[5.7.2 Partial Shipments](#partial-shipments)

[5.7.3 Insufficient Stock Guard and Real-Time Inventory Visibility [MODIFIED]](#insufficient-stock-guard-and-real-time-inventory-visibility-modified)

[5.7.4 Shipment Record](#shipment-record)

[5.8 Bulk Shipment Processing [ADDED]](#bulk-shipment-processing-added)

[5.8.1 Batch Ship](#batch-ship)

[5.8.2 Next Order Flow](#next-order-flow)

[5.9 Fast Scan-to-Ship Workflow [ADDED]](#fast-scan-to-ship-workflow-added)

[5.9.1 Entry](#entry)

[5.9.2 Workflow](#workflow)

[5.9.3 Real-Time Feedback](#real-time-feedback)

[5.10 Real-Time Inventory Display in All Shipping Contexts [ADDED]](#real-time-inventory-display-in-all-shipping-contexts-added)

[6. Inventory Actions Module](#inventory-actions-module)

[6.1 Purpose](#purpose-6)

[6.2 Manual Outbound](#manual-outbound)

[6.2.1 Purpose](#purpose-7)

[6.2.2 Outbound Types](#outbound-types)

[6.2.3 Manual Outbound Workflow](#manual-outbound-workflow)

[6.2.4 Batch Outbound](#batch-outbound)

[6.2.5 Damaged Inventory Value Tracking](#damaged-inventory-value-tracking)

[6.3 Cycle Counts](#cycle-counts)

[6.3.1 Purpose](#purpose-8)

[6.3.2 Cycle Count Workflow](#cycle-count-workflow)

[6.3.3 Cycle Count Record](#cycle-count-record)

[6.4 Inventory Adjustments](#inventory-adjustments)

[6.4.1 Purpose](#purpose-9)

[6.4.2 Adjustment Workflow](#adjustment-workflow)

[6.4.3 Adjustment Record](#adjustment-record)

[6.5 Inventory Transfers](#inventory-transfers)

[6.5.1 Purpose](#purpose-10)

[6.5.2 Transfer Workflow](#transfer-workflow)

[7. Inventory Value Logic](#inventory-value-logic)

[7.1 Cost Entry Point](#cost-entry-point)

[7.2 Weighted Average Cost Calculation](#weighted-average-cost-calculation-1)

[7.3 Cost History](#cost-history)

[7.4 Inventory Value Display](#inventory-value-display)

[8. Integrations](#integrations)

[8.1 Scope](#scope)

[8.2 eBay Integration](#ebay-integration)

[8.2.1 Sync Direction](#sync-direction)

[8.2.2 Sync Behavior](#sync-behavior)

[8.2.3 Data Imported](#data-imported)

[8.3 WooCommerce Integration](#woocommerce-integration)

[8.3.1 Sync Direction](#sync-direction-1)

[8.3.2 Sync Behavior](#sync-behavior-1)

[8.4 Integration Configuration](#integration-configuration)

[8.5 Error Handling](#error-handling)

[9. Barcode Usage](#barcode-usage)

[9.1 Principle](#principle)

[9.2 Supported Workflows](#supported-workflows)

[9.3 Scanner Compatibility](#scanner-compatibility)

[10. Data Flow Between Modules](#data-flow-between-modules)

[10.1 Inventory Quantity Change Summary](#inventory-quantity-change-summary)

[10.2 Cost Data Flow](#cost-data-flow)

[10.3 Integration Data Flow](#integration-data-flow)

[11. Edge Case Handling](#edge-case-handling)

[11.1 Partial Purchase Order Receiving](#partial-purchase-order-receiving)

[11.2 Partial Order Shipments](#partial-order-shipments)

[11.3 SKU Mismatches from Integrations](#sku-mismatches-from-integrations)

[11.4 Inventory Discrepancies During Counts](#inventory-discrepancies-during-counts)

[11.5 Damaged Inventory Requiring Value Tracking](#damaged-inventory-requiring-value-tracking)

[11.6 Manual Outbound Bypassing Integrations](#manual-outbound-bypassing-integrations)

[11.7 Negative Inventory](#negative-inventory)

[11.8 Duplicate Integration Orders](#duplicate-integration-orders)

[11.9 Cost Changes Over Time](#cost-changes-over-time)

[11.10 Deleted or Inactive Products](#deleted-or-inactive-products)

[11.11 Incorrect Shipment: Wrong Quantity Shipped [ADDED]](#incorrect-shipment-wrong-quantity-shipped-added)

[11.11.1 Correction Workflow: Over-Shipped](#correction-workflow-over-shipped)

[11.11.2 Correction Workflow: Under-Shipped](#correction-workflow-under-shipped)

[11.12 Incorrect Shipment: Wrong SKU Shipped [ADDED]](#incorrect-shipment-wrong-sku-shipped-added)

[11.13 Accidental Batch Shipment [ADDED]](#accidental-batch-shipment-added)

[11.14 Adjustment Reason: Shipment Correction [ADDED]](#adjustment-reason-shipment-correction-added)

[12. Audit Trail](#audit-trail)

[12.1 Principle](#principle-1)

[12.2 Auditable Events](#auditable-events)

[12.3 Activity Log](#activity-log)

[13. Automation Rules](#automation-rules)

[14. User Interface Requirements](#user-interface-requirements)

[14.1 General Principles](#general-principles)

[14.2 Navigation](#navigation)

[14.3 Confirmations](#confirmations)

[14.4 Search Behavior](#search-behavior)

[14.5 Keyboard Shortcuts [ADDED]](#keyboard-shortcuts-added)

[15. Non-Functional Requirements](#non-functional-requirements)

[15.1 Performance [MODIFIED]](#performance-modified)

[15.2 Data Integrity](#data-integrity)

[15.3 Availability](#availability)

[15.4 Data Retention](#data-retention)

[16. Glossary](#glossary)

# 1. System Overview

## 1.1 Purpose

This document defines the product requirements for a custom inventory management system designed for a business that warehouses and sells cardboard shipping boxes. The system replaces error-prone manual processes with automated inventory deduction tied to confirmed operational events, eliminating reliance on human memory to keep stock levels accurate.

## 1.2 Problem Statement

The current operation suffers from chronic inventory inaccuracy. Employees fail to consistently remove inventory from the system because the process requires manual steps that are easy to skip under time pressure. This results in phantom stock, over-selling, and inability to trust system quantities for purchasing decisions.

## 1.3 Core Design Principle

Inventory changes only when a verifiable operational event occurs. Inbound stock increases only upon confirmed receipt against a purchase order. Outbound stock decreases only when an order is marked as shipped or a manual outbound action is confirmed. There is no intermediate inventory hold, reservation, or pre-allocation.

## 1.4 Design Constraints

- Single user role (Admin). No permissions or role-based access.

- No accounting, invoicing, or financial reporting features.

- No advanced analytics or BI dashboards.

- No bundle or kitting logic. All inventory is tracked at the individual SKU level.

- No Amazon API integration. Amazon-related outbound is handled manually.

- Optimized for desktop and tablet. Mobile is not a primary target.

- Barcode scanning is supported but never required for any workflow.

## 1.5 System Modules

The system consists of exactly five modules:

| **Module**        | **Primary Responsibility**                                            |
|-------------------|-----------------------------------------------------------------------|
| Dashboard         | Operational snapshot: alerts, pending actions, inventory value        |
| Products          | SKU catalog, weighted average cost, stock levels, location            |
| Purchase Orders   | Inbound procurement lifecycle and inventory receiving                 |
| Orders            | Synced and manual outbound order processing and shipment confirmation |
| Inventory Actions | Cycle counts, adjustments, transfers, manual outbound                 |

## 1.6 User Model

All users are trusted, experienced warehouse administrators. The interface uses plain operational language (Receive, Ship, Adjust, Count, Transfer) and assumes competence. There is no onboarding wizard, tooltip-heavy UI, or confirmation dialogs beyond a single confirmation on destructive or irreversible actions.

# 2. Dashboard Module

## 2.1 Purpose

The Dashboard provides a single-screen operational snapshot. It surfaces only actionable information and pending tasks. It is the default landing page after login.

## 2.2 Dashboard Sections

### 2.2.1 Alerts Panel

Displays time-sensitive items requiring attention. Each alert links directly to the relevant record.

- Low stock warnings: SKUs below reorder threshold (configurable per SKU)

- Unmatched SKU alerts: Integration orders containing SKUs not mapped in the system

- Overdue purchase orders: POs past expected delivery date with unreceived quantities

- Pending cycle counts: Scheduled counts that have not been started

### 2.2.2 Pending Actions Panel

- Purchase orders awaiting receipt (count and total open quantity)

- Orders ready to ship (imported but not yet marked shipped)

- Cycle counts scheduled for today or overdue

### 2.2.3 Inventory Summary Panel

- Total SKU count (active SKUs with stock on hand)

- Total units on hand (sum of all SKU quantities)

- Total inventory value (sum of quantity multiplied by weighted average cost per SKU)

- Units received today / this week

- Units shipped today / this week

### 2.2.4 Recent Activity Feed

Chronological list of the last 25 inventory-affecting events with timestamp, user, action type, SKU, and quantity change. Each entry links to the source record.

## 2.3 Today’s Work View [ADDED]

The Dashboard includes a dedicated operational view optimized for warehouse execution. This is not a report; it is a live work queue designed to drive the day’s shipping activity with minimal navigation.

### 2.3.1 Purpose

Today’s Work consolidates all orders ready to ship into a single actionable list. It eliminates the need to navigate to the Orders module, apply filters, and scan for actionable items. The user opens the Dashboard and immediately sees what needs to go out today.

### 2.3.2 Content

- Ready to Ship queue: All orders in Pending or Partially Shipped status, sorted by order date (oldest first). Each row shows Order ID, Source (eBay/WooCommerce/Manual), Customer Name, line count, and total units remaining to ship.

- In-Progress section: Orders the current user has started processing but not yet confirmed. Persists for the current session only.

- Shipped Today counter: Running count of orders and total units shipped during the current calendar day.

- Quick-action buttons: Each order row includes a Ship button that opens the shipment confirmation form inline or navigates directly to the ship flow, bypassing the order detail view.

### 2.3.3 Interaction

Clicking Ship on any row in the Ready to Ship queue opens the shipment confirmation panel for that order. After confirming shipment, the system automatically advances to the next order in the queue (see Section 5.8.2 Next Order Flow). The user can also click into the order detail view if needed, but the default path is optimized for fast sequential processing.

# 3. Products Module

## 3.1 Purpose

The Products module is the SKU catalog. It stores all product definitions, current stock levels, cost data, integration mappings, and location assignments. It does not directly modify inventory quantities; those changes flow from Purchase Orders, Orders, and Inventory Actions.

## 3.2 Product Record Fields

| **Field**            | **Description**                                     | **Rules**                                   |
|----------------------|-----------------------------------------------------|---------------------------------------------|
| SKU                  | Internal stock keeping unit identifier              | Required. Unique. Immutable after creation. |
| Product Name         | Human-readable product description                  | Required.                                   |
| Barcode              | Scannable barcode value (UPC, EAN, or custom)       | Optional. Unique if provided.               |
| Category             | Product grouping                                    | Optional. Free-text or dropdown.            |
| Current Quantity     | Units currently on hand                             | System-calculated. Read-only.               |
| Reorder Threshold    | Quantity triggering low stock alert                 | Optional. Default: 0 (no alert).            |
| Location             | Physical warehouse location                         | Optional. Single location per SKU.          |
| Weighted Avg. Cost   | Current weighted average cost per unit              | System-calculated. Read-only.               |
| Total Value          | Current Quantity x Weighted Avg. Cost               | System-calculated. Read-only.               |
| Integration Mappings | Linked eBay listing IDs and WooCommerce product IDs | Configurable per SKU.                       |
| Status               | Active or Inactive                                  | Default: Active.                            |
| Notes                | Free-text operational notes                         | Optional.                                   |
| Created Date         | Record creation timestamp                           | System-generated.                           |
| Last Modified        | Last update timestamp                               | System-generated.                           |

## 3.3 Product List View

Displays all products in a sortable, filterable, searchable table. Columns displayed: SKU, Product Name, Current Quantity, Weighted Avg. Cost, Total Value, Location, Status. Search operates across SKU, Product Name, and Barcode fields simultaneously. Barcode scanner input triggers an instant search and navigates directly to the matching product if a single result is found.

## 3.4 Integration SKU Mapping

Each product record supports mapping to one or more external platform identifiers. When an order imports from eBay or WooCommerce, the system matches the external SKU to an internal SKU using these mappings. If no mapping exists, the order is flagged with an unmatched SKU alert and the SKU appears on the Dashboard alerts panel.

## 3.5 Weighted Average Cost Calculation

Cost is recalculated on every inbound receipt using the standard weighted average formula:

New WAC = ((Existing Qty x Existing WAC) + (Received Qty x Receipt Unit Cost)) / (Existing Qty + Received Qty)

If existing quantity is zero, the WAC resets to the receipt unit cost. Outbound actions do not change WAC; they reduce quantity and total value proportionally.

# 4. Purchase Orders Module

## 4.1 Purpose

The Purchase Orders module manages the full inbound procurement lifecycle. It is the only pathway through which inventory quantities increase and cost data enters the system. Every unit added to stock must trace back to a purchase order receipt.

## 4.2 Purchase Order Record Fields

| **Field**     | **Description**                                  | **Rules**                                     |
|---------------|--------------------------------------------------|-----------------------------------------------|
| PO Number     | Unique purchase order identifier                 | Auto-generated or manually entered. Required. |
| Supplier      | Vendor name or identifier                        | Required.                                     |
| Status        | Open, Partially Received, Fully Received, Closed | System-managed based on receipt status.       |
| Created Date  | Date PO was created                              | System-generated.                             |
| Expected Date | Expected delivery date                           | Optional. Triggers overdue alert.             |
| BOL Number    | Bill of Lading reference from supplier           | Optional. Entered at receipt time.            |
| Notes         | Free-text notes                                  | Optional.                                     |

## 4.3 Purchase Order Line Items

| **Field**     | **Description**                 | **Rules**                         |
|---------------|---------------------------------|-----------------------------------|
| SKU           | Product being ordered           | Required. Must exist in Products. |
| Ordered Qty   | Quantity ordered from supplier  | Required. Positive integer.       |
| Unit Cost     | Cost per unit for this order    | Required. Positive decimal.       |
| Received Qty  | Total quantity received to date | System-calculated from receipts.  |
| Remaining Qty | Ordered minus Received          | System-calculated. Read-only.     |
| Line Status   | Open, Partial, Complete         | System-managed.                   |

## 4.4 Purchase Order Statuses

| **Status**         | **Condition**                                      | **Transitions**                                       |
|--------------------|----------------------------------------------------|-------------------------------------------------------|
| Open               | PO created, no receipts recorded                   | Transitions to Partially Received on first receipt    |
| Partially Received | At least one receipt exists but remaining qty > 0 | Transitions to Fully Received when all lines complete |
| Fully Received     | All line items fully received                      | Can transition to Closed manually                     |
| Closed             | PO archived. No further receipts allowed.          | Terminal state. Manual action only.                   |

## 4.5 Receiving Workflow

This is the most critical inbound workflow. Receiving is the only mechanism that increases inventory. The workflow must be fast, support partial receipts, and handle discrepancies.

### 4.5.1 Standard Receiving Flow

1.  User navigates to the PO or selects it from the Dashboard pending actions.

2.  User clicks Receive.

3.  System displays all line items with Ordered Qty, Previously Received Qty, and an editable Receiving Qty field defaulting to Remaining Qty.

4.  User adjusts quantities to match the physical shipment. User may scan barcodes to locate and auto-populate line items.

5.  User optionally enters BOL number.

6.  User clicks Confirm Receipt.

7.  System creates a receipt record, increases inventory for each SKU by the confirmed quantity, updates the SKU weighted average cost, and updates the PO status.

### 4.5.2 Partial Receiving

If the received quantity for any line item is less than the remaining quantity, the PO transitions to Partially Received. The user can perform additional receive actions against the same PO until all lines are complete. Each receipt is stored as a separate receipt record with its own timestamp, quantities, and BOL reference.

### 4.5.3 Over-Receiving

The system allows receiving more than the ordered quantity for a line item. A visual warning is displayed but does not block the action. The overage is reflected in the receipt record and inventory is increased accordingly. This handles real-world situations where suppliers ship extra units.

### 4.5.4 Receipt Record

| **Field**    | **Description**                            | **Rules**                  |
|--------------|--------------------------------------------|----------------------------|
| Receipt ID   | Unique receipt identifier                  | System-generated.          |
| PO Number    | Parent purchase order                      | Required.                  |
| Receipt Date | Timestamp of receipt                       | System-generated.          |
| BOL Number   | Bill of Lading reference                   | Optional.                  |
| Line Items   | SKU, received quantity, unit cost per line | From PO line + user input. |
| Received By  | User who confirmed receipt                 | System-captured.           |

# 5. Orders Module

## 5.1 Purpose

The Orders module manages outbound fulfillment for customer orders. Orders arrive via automatic sync from eBay and WooCommerce, or through manual entry. Inventory is deducted only when an order is confirmed as shipped, not at any earlier stage.

## 5.2 Order Record Fields

| **Field**         | **Description**                                | **Rules**                                   |
|-------------------|------------------------------------------------|---------------------------------------------|
| Order ID          | Internal order identifier                      | System-generated.                           |
| External Order ID | eBay or WooCommerce order number               | Populated by sync. Blank for manual orders. |
| Source            | eBay, WooCommerce, or Manual                   | System-set or user-selected.                |
| Status            | Pending, Partially Shipped, Shipped, Cancelled | System-managed.                             |
| Customer Name     | Buyer name                                     | From integration or manual entry.           |
| Order Date        | Date order was placed                          | From integration or manual entry.           |
| Import Date       | Date order entered the system                  | System-generated.                           |
| Ship Date         | Date order was marked shipped                  | System-set on shipment confirmation.        |
| Tracking Number   | Carrier tracking reference                     | Optional. Entered at ship time.             |
| Notes             | Free-text notes                                | Optional.                                   |

## 5.3 Order Line Items

| **Field**     | **Description**                        | **Rules**                         |
|---------------|----------------------------------------|-----------------------------------|
| SKU           | Internal SKU (mapped from external ID) | Required.                         |
| Product Name  | Human-readable name                    | From Products module.             |
| Ordered Qty   | Quantity customer ordered              | Required. Positive integer.       |
| Shipped Qty   | Quantity shipped to date               | System-calculated from shipments. |
| Remaining Qty | Ordered minus Shipped                  | System-calculated.                |
| Line Status   | Pending, Partial, Complete             | System-managed.                   |

## 5.4 Order Statuses

| **Status**        | **Condition**                                       | **Transitions**                        |
|-------------------|-----------------------------------------------------|----------------------------------------|
| Pending           | Order imported or created, nothing shipped          | To Partially Shipped or Shipped        |
| Partially Shipped | At least one shipment exists but remaining qty > 0 | To Shipped when all lines complete     |
| Shipped           | All line items fully shipped                        | Terminal state for fulfilled orders    |
| Cancelled         | Order cancelled before full shipment                | Terminal state. Reverses no inventory. |

Cancellation rule: If an order is cancelled before any shipment, no inventory change occurs. If an order is cancelled after a partial shipment, only the shipped quantities remain deducted. The user must use an Inventory Adjustment to restore any quantities if needed.

## 5.5 Order Sync (eBay and WooCommerce)

### 5.5.1 Sync Mechanism

The system polls eBay and WooCommerce APIs at a configurable interval (default: every 15 minutes) for new paid orders. Orders are imported with all line items, customer details, and external order references. Sync is also available as a manual trigger from the Orders list view.

### 5.5.2 SKU Matching on Import

1.  System reads each line item external SKU from the incoming order.

2.  System checks the Integration Mappings on all Product records for a match.

3.  If a match is found, the line item is linked to the internal SKU.

4.  If no match is found, the line item is flagged as Unmatched. The order is importable but cannot be shipped until all SKUs are resolved.

5.  Unmatched SKUs appear on the Dashboard alerts panel.

### 5.5.3 Resolving Unmatched SKUs

From the order detail view, the user can resolve an unmatched SKU by selecting an existing internal SKU. The system offers to save this as a permanent mapping so future orders with the same external SKU auto-match. If the product does not exist, the user must first create it in the Products module.

## 5.6 Manual Order Entry [MODIFIED]

Users can create orders manually to track outbound shipments that do not originate from eBay or WooCommerce. Manual orders follow the same shipment confirmation workflow. Source is set to Manual.

### 5.6.1 Optimized Multi-Line Entry

Manual order entry is optimized for speed when processing large outbound shipments such as wholesale orders or FBA prep. The entry form supports rapid multi-line SKU input without requiring the user to save or navigate between steps.

- Scan-and-add: User scans a barcode or types a SKU. The system immediately adds the SKU as a new line item with quantity defaulting to 1. The cursor auto-advances to the quantity field for adjustment, then returns focus to the SKU input field for the next scan.

- Continuous scan mode: For high-volume entry, repeated scans of the same SKU increment the quantity on the existing line rather than creating duplicate lines.

- Inline quantity editing: Quantity fields are editable inline. Tab or Enter advances to the next line. No modal dialogs or save buttons between lines.

- Running total: The form displays a live count of total line items and total units as the user builds the order.

- Bulk paste: User can paste a tab-separated or comma-separated list of SKU and quantity pairs. The system parses and populates all lines at once, flagging any SKUs not found in the catalog.

### 5.6.2 Quick Ship Option

For manual orders that are being created and shipped simultaneously (e.g., an FBA shipment being packed right now), the form includes a Create and Ship button. This creates the order and immediately confirms shipment in a single action, deducting inventory without requiring the user to navigate to the order and click Ship separately. This eliminates two clicks and one page load from the workflow.

## 5.7 Shipment Confirmation Workflow

This is the critical outbound workflow. Inventory is deducted only at this step.

### 5.7.1 Standard Ship Flow

1.  User navigates to a Pending order.

2.  User clicks Ship.

3.  System displays all line items with Ordered Qty, Previously Shipped Qty, and an editable Shipping Qty field defaulting to Remaining Qty.

4.  User adjusts quantities if performing a partial shipment.

5.  User optionally enters a tracking number.

6.  User clicks Confirm Shipment.

7.  System creates a shipment record, deducts inventory for each SKU by the confirmed quantity, and updates the order status.

### 5.7.2 Partial Shipments

If the shipped quantity for any line item is less than the remaining quantity, the order transitions to Partially Shipped. The user can perform additional ship actions against the same order. Each shipment is stored as a separate shipment record.

### 5.7.3 Insufficient Stock Guard and Real-Time Inventory Visibility [MODIFIED]

During shipment confirmation, the system displays the current on-hand quantity for every SKU on the shipment form, adjacent to the shipping quantity field. This provides immediate context without requiring the user to look up stock levels separately.

- Green indicator: On-hand quantity exceeds shipping quantity by more than the reorder threshold. No risk.

- Yellow indicator: On-hand quantity is positive but will drop below the reorder threshold after this shipment. Informational only; does not block.

- Red indicator: On-hand quantity is less than the shipping quantity, meaning this shipment will drive inventory negative. A compact inline warning is displayed on the affected line.

All indicators render inline as colored badges next to the on-hand quantity. They do not trigger modal dialogs, popups, or any interaction that would slow down the workflow. The user can ship regardless of indicator color.

### 5.7.4 Shipment Record

| **Field**       | **Description**                | **Rules**                     |
|-----------------|--------------------------------|-------------------------------|
| Shipment ID     | Unique shipment identifier     | System-generated.             |
| Order ID        | Parent order                   | Required.                     |
| Ship Date       | Timestamp of shipment          | System-generated.             |
| Tracking Number | Carrier tracking reference     | Optional.                     |
| Line Items      | SKU, shipped quantity per line | From order line + user input. |
| Shipped By      | User who confirmed shipment    | System-captured.              |

## 5.8 Bulk Shipment Processing [ADDED]

For high-volume operations where dozens or hundreds of orders ship daily, the system provides bulk processing workflows that minimize navigation, reduce clicks, and keep the user in a continuous shipping flow.

### 5.8.1 Batch Ship

From the Orders list view or the Today’s Work queue, the user can select multiple orders using checkboxes and click Batch Ship. The system processes all selected orders in sequence.

1.  User selects multiple Pending orders via checkboxes in the list view.

2.  User clicks Batch Ship.

3.  System displays a summary: number of orders, total SKUs, total units. Optionally, user enters a single tracking number prefix or leaves blank.

4.  User clicks Confirm Batch.

5.  System processes each order at full ordered quantities, deducts inventory, creates individual shipment records, and updates all order statuses to Shipped.

6.  System displays a batch result summary showing orders processed, total units shipped, and any orders that had insufficient stock (these are flagged but still processed).

Batch Ship assumes full shipment of all line items. It is designed for standard single-shipment orders where no partial processing is needed. Orders requiring partial shipment should be processed individually.

### 5.8.2 Next Order Flow

After confirming shipment on an individual order, the system does not return to the list view. Instead, it automatically loads the next Pending order in queue and presents the shipment confirmation form. This eliminates the list-view round trip for each order.

1.  User confirms shipment on current order.

2.  System displays a brief success banner (auto-dismisses after 2 seconds) showing the order ID and units shipped.

3.  System immediately loads the next order from the queue (same sort order as Today’s Work: oldest first by order date).

4.  Shipment confirmation form is pre-populated with full quantities.

5.  User reviews, optionally adjusts, and clicks Confirm Shipment.

6.  Cycle repeats until the queue is empty or the user clicks Exit Queue to return to the list view.

The user can skip an order in the queue without shipping it. Skipped orders remain in Pending status and reappear at the end of the queue.

## 5.9 Fast Scan-to-Ship Workflow [ADDED]

Scan-to-Ship is a dedicated high-speed mode for environments where each order maps to a single SKU or where orders can be identified by a printed order barcode. It reduces the standard ship flow from multiple clicks to a scan-and-confirm interaction.

### 5.9.1 Entry

The user accesses Scan-to-Ship from the Orders module toolbar or via keyboard shortcut (Ctrl+Shift+S). The system enters a focused scan mode: a prominent scan input field occupies the center of the screen, with a compact shipping log below it.

### 5.9.2 Workflow

1.  User scans a barcode. The system interprets the scan as either an Order ID (external or internal) or a SKU.

2.  If the scan matches an Order ID: the system loads the order. If the order has a single line item, the shipment confirmation form auto-populates with full quantity and the user presses Enter or clicks Confirm to ship immediately. If the order has multiple lines, the standard shipment form opens.

3.  If the scan matches a SKU: the system searches for Pending orders containing that SKU and displays the oldest matching order. The user confirms or selects from a short list if multiple orders match.

4.  After confirmation, the success result appends to the shipping log below the scan field, and focus returns to the scan input for the next order.

The shipping log shows a scrolling list of orders shipped during the current Scan-to-Ship session: Order ID, SKU(s), units, and timestamp. This gives the user a running record without leaving the scan mode.

### 5.9.3 Real-Time Feedback

During Scan-to-Ship, the system provides immediate visual feedback after each scan:

- Green flash: Order found, ready to confirm.

- Yellow flash: Order found, but one or more SKUs have low inventory.

- Red flash: No matching order found, or SKU not recognized. The scan field retains the scanned value for the user to review.

Audio feedback (optional, configurable): a short confirmation tone on successful ship, an error tone on scan failure.

## 5.10 Real-Time Inventory Display in All Shipping Contexts [ADDED]

Across all shipping workflows (standard, batch, next-order, and scan-to-ship), the system displays current on-hand quantity for each SKU being shipped. This display follows the color-coded indicator pattern defined in Section 5.7.3 and is non-blocking. The on-hand quantity reflects the live system value at the moment the form loads, accounting for any shipments confirmed moments earlier in the same session. This ensures the user always has accurate stock context without needing to check the Products module.

# 6. Inventory Actions Module

## 6.1 Purpose

The Inventory Actions module handles all inventory changes that do not originate from purchase order receipts or order shipments. This includes manual outbound, cycle counts, adjustments, and transfers. Every action creates an auditable record.

## 6.2 Manual Outbound

### 6.2.1 Purpose

Manual outbound covers all inventory leaving the warehouse outside of synced eBay/WooCommerce orders. This is critical for operations like FBA shipments, direct Amazon orders, damaged inventory, samples, and internal use.

### 6.2.2 Outbound Types

| **Type**     | **Description**                                 | **Special Behavior**                                               |
|--------------|-------------------------------------------------|--------------------------------------------------------------------|
| Amazon FBA   | Inventory shipped to Amazon fulfillment centers | None. Standard deduction.                                          |
| Amazon Order | Manual Amazon orders not via integration        | None. Standard deduction.                                          |
| Damaged      | Inventory removed due to damage                 | Records unit cost at time of removal for supplier credit tracking. |
| Internal Use | Inventory consumed internally                   | None. Standard deduction.                                          |
| Sample       | Units sent as samples                           | None. Standard deduction.                                          |
| Other        | Any other outbound reason                       | User enters free-text reason.                                      |

### 6.2.3 Manual Outbound Workflow

1.  User selects Outbound from Inventory Actions.

2.  User selects outbound type from dropdown.

3.  User scans barcode or searches for SKU.

4.  System displays product name, current quantity, and weighted average cost.

5.  User enters quantity to remove.

6.  User clicks Confirm.

7.  Inventory deducts immediately. An outbound record is created.

### 6.2.4 Batch Outbound

For FBA shipments involving multiple SKUs, the system supports adding multiple line items before confirming. The user scans or searches for each SKU, enters quantities, and builds a list. A single Confirm action deducts all items and creates one outbound record with all lines.

### 6.2.5 Damaged Inventory Value Tracking

When the outbound type is Damaged, the system captures the weighted average cost per unit at the time of removal and stores it on the outbound record. This provides the cost basis needed for supplier credit claims. A filtered view of all damaged outbound records is available, showing SKU, quantity, unit cost, total cost, and date.

## 6.3 Cycle Counts

### 6.3.1 Purpose

Cycle counts verify physical inventory against system quantities. They are the primary mechanism for detecting and correcting discrepancies.

### 6.3.2 Cycle Count Workflow

1.  User creates a new cycle count, selecting SKUs to count (individually, by category, by location, or all SKUs).

2.  System generates a count sheet showing SKU, Product Name, Location, and a blank Counted Qty field. System quantity is hidden during counting to prevent bias.

3.  User physically counts inventory and enters counted quantities. Barcode scanning is supported to locate SKUs on the count sheet.

4.  User clicks Review when counting is complete.

5.  System displays a discrepancy report: SKU, System Qty, Counted Qty, Variance (quantity and percentage).

6.  User reviews discrepancies. For each discrepancy, the user can Accept (adjust system quantity to match count) or Recount (re-enter the counted quantity).

7.  User clicks Finalize Count.

8.  System adjusts inventory for all accepted discrepancies and creates adjustment records linked to the cycle count.

### 6.3.3 Cycle Count Record

| **Field**        | **Description**                            | **Rules**                   |
|------------------|--------------------------------------------|-----------------------------|
| Count ID         | Unique count identifier                    | System-generated.           |
| Status           | In Progress, Completed                     | System-managed.             |
| Created Date     | Date count was initiated                   | System-generated.           |
| Completed Date   | Date count was finalized                   | System-set on finalization. |
| Counted By       | User who performed the count               | System-captured.            |
| SKU Count        | Number of SKUs included in count           | System-calculated.          |
| Discrepancies    | Number of SKUs with variance               | System-calculated.          |
| Adjustments Made | Number of adjustments accepted and applied | System-calculated.          |

## 6.4 Inventory Adjustments

### 6.4.1 Purpose

Adjustments allow direct modification of inventory quantities outside of counts. They are used for corrections, write-offs, and other situations where a cycle count is not practical.

### 6.4.2 Adjustment Workflow

1.  User selects Adjust from Inventory Actions.

2.  User scans barcode or searches for SKU.

3.  System displays current quantity.

4.  User enters the new quantity or a +/- delta.

5.  User selects a reason from dropdown: Count Correction, Write-Off, Found Inventory, Shipment Correction, Data Fix, Other.

6.  User optionally enters notes.

7.  User clicks Confirm.

8.  Inventory updates immediately. An adjustment record is created.

### 6.4.3 Adjustment Record

| **Field**       | **Description**                      | **Rules**           |
|-----------------|--------------------------------------|---------------------|
| Adjustment ID   | Unique identifier                    | System-generated.   |
| SKU             | Product adjusted                     | Required.           |
| Previous Qty    | Quantity before adjustment           | System-captured.    |
| New Qty         | Quantity after adjustment            | Required.           |
| Delta           | Change amount (positive or negative) | System-calculated.  |
| Reason          | Reason code                          | Required.           |
| Notes           | Free-text notes                      | Optional.           |
| Adjusted By     | User who made adjustment             | System-captured.    |
| Date            | Timestamp                            | System-generated.   |
| Linked Count ID | If originated from cycle count       | Null if standalone. |

## 6.5 Inventory Transfers

### 6.5.1 Purpose

Transfers move inventory from one location to another within the warehouse. They do not change total quantity, only the location assignment on the product record.

### 6.5.2 Transfer Workflow

1.  User selects Transfer from Inventory Actions.

2.  User scans barcode or searches for SKU.

3.  System displays current location and quantity.

4.  User enters new location.

5.  User clicks Confirm.

6.  System updates the location field on the product record and creates a transfer record.

Note: Because the system uses single-location tracking per SKU (not multi-bin), a transfer changes the entire SKU location. If a SKU is split across locations, separate SKU records should be created.

# 7. Inventory Value Logic

## 7.1 Cost Entry Point

Cost enters the system exclusively through purchase order line items. Each PO line specifies a unit cost. This cost is recorded on the receipt record and used to update the SKU weighted average cost.

## 7.2 Weighted Average Cost Calculation

The system uses the weighted average cost (WAC) method. WAC is recalculated on each receipt event using the following formula:

New WAC = ((Current On-Hand Qty x Current WAC) + (Receipt Qty x Receipt Unit Cost)) / (Current On-Hand Qty + Receipt Qty)

Special cases:

- If current on-hand quantity is zero: WAC resets to the receipt unit cost.

- If current on-hand quantity is negative (due to overselling): WAC resets to the receipt unit cost. The negative quantity is resolved by the receipt.

- Outbound actions (shipments, manual outbound, adjustments) do not recalculate WAC. They reduce quantity and total value using the existing WAC.

## 7.3 Cost History

The system maintains a complete cost history through receipt records. Each receipt stores the unit cost at the time of receiving. This allows the business to review historical cost trends per SKU and per supplier. The cost history is viewable from the Product detail view.

## 7.4 Inventory Value Display

- Per-SKU value: Current Quantity x Weighted Average Cost. Displayed on the Product detail view and Product list view.

- Total inventory value: Sum of all per-SKU values. Displayed on the Dashboard.

- Damaged outbound value: Recorded at time of removal using WAC. Viewable in a filtered Damaged Outbound report within Inventory Actions.

# 8. Integrations

## 8.1 Scope

The system integrates with two external platforms for order synchronization: eBay and WooCommerce. There is no Amazon API integration; Amazon-related inventory is handled through the manual outbound workflow.

## 8.2 eBay Integration

### 8.2.1 Sync Direction

Inbound only. The system pulls paid orders from eBay. It does not push inventory levels, pricing, or product data back to eBay.

### 8.2.2 Sync Behavior

- Polls eBay API at configurable interval (default: 15 minutes).

- Imports orders with status Paid or higher.

- Deduplicates by external order ID to prevent double import.

- Maps eBay item SKU to internal SKU using Integration Mappings.

- Flags unmatched SKUs for manual resolution.

- Manual sync trigger available in Orders list view.

### 8.2.3 Data Imported

External order ID, buyer name, order date, line items (external SKU, quantity, item title), and shipping address (stored for reference but not used operationally by this system).

## 8.3 WooCommerce Integration

### 8.3.1 Sync Direction

Inbound only. Identical behavior to eBay sync, adapted for WooCommerce REST API.

### 8.3.2 Sync Behavior

- Polls WooCommerce REST API at configurable interval (default: 15 minutes).

- Imports orders with status Processing.

- Deduplicates by external order ID.

- Maps WooCommerce product SKU to internal SKU.

- Flags unmatched SKUs for manual resolution.

## 8.4 Integration Configuration

| **Setting**          | **Description**                           | **Default**                    |
|----------------------|-------------------------------------------|--------------------------------|
| eBay API Credentials | OAuth tokens for eBay API access          | Required for eBay sync.        |
| WooCommerce URL      | Base URL of WooCommerce store             | Required for WooCommerce sync. |
| WooCommerce API Keys | Consumer key and secret                   | Required for WooCommerce sync. |
| Sync Interval        | Minutes between automatic sync polls      | 15 minutes.                    |
| Auto-Sync Enabled    | Toggle automatic sync on/off per platform | Enabled.                       |

## 8.5 Error Handling

- API connection failures: Retry with exponential backoff (3 attempts). Log failure. Display sync error on Dashboard.

- Rate limiting: Respect platform rate limits. Queue requests and process within limits.

- Duplicate orders: Skip silently based on external order ID.

- Invalid data: Import the order but flag individual fields that cannot be parsed. Do not reject the entire order.

# 9. Barcode Usage

## 9.1 Principle

Barcode scanning accelerates workflows but is never mandatory. Every action that supports barcode scanning also supports manual SKU search and keyboard entry. The system must function fully without a barcode scanner connected.

## 9.2 Supported Workflows

| **Workflow**             | **Barcode Behavior**                                                        | **Fallback**                        |
|--------------------------|-----------------------------------------------------------------------------|-------------------------------------|
| Purchase Order Receiving | Scan to locate line item on receipt form and auto-focus the quantity field  | Search by SKU or scroll line items  |
| Cycle Counting           | Scan to locate SKU on count sheet and auto-focus the counted quantity field | Search by SKU or scroll count sheet |
| Manual Outbound          | Scan to populate the SKU field                                              | Type or search SKU                  |
| Inventory Adjustment     | Scan to populate the SKU field                                              | Type or search SKU                  |
| Product Search           | Scan to search and navigate to product                                      | Type SKU or name in search          |

## 9.3 Scanner Compatibility

The system treats barcode scanner input as keyboard input (HID mode). No special drivers or scanner configuration is required. The system detects rapid sequential character input followed by a carriage return as a barcode scan event.

# 10. Data Flow Between Modules

## 10.1 Inventory Quantity Change Summary

| **Event**                       | **Direction**        | **Source Module** | **Trigger**                  |
|---------------------------------|----------------------|-------------------|------------------------------|
| PO Receipt Confirmed            | Increase (+)         | Purchase Orders   | User clicks Confirm Receipt  |
| Order Shipment Confirmed        | Decrease (-)         | Orders            | User clicks Confirm Shipment |
| Manual Outbound Confirmed       | Decrease (-)         | Inventory Actions | User clicks Confirm          |
| Cycle Count Adjustment Accepted | Increase or Decrease | Inventory Actions | User finalizes count         |
| Manual Adjustment Confirmed     | Increase or Decrease | Inventory Actions | User clicks Confirm          |

## 10.2 Cost Data Flow

1.  User enters unit cost on Purchase Order line item.

2.  On receipt confirmation, cost flows to the Receipt Record.

3.  Receipt Record triggers recalculation of Product Weighted Average Cost.

4.  Product WAC is used to calculate per-SKU and total inventory value.

5.  On Damaged outbound, current WAC is snapshot to the outbound record.

## 10.3 Integration Data Flow

1.  eBay/WooCommerce API returns new paid orders.

2.  System creates Order records with line items.

3.  External SKUs are matched against Product Integration Mappings.

4.  Unmatched SKUs are flagged on the order and surfaced on the Dashboard.

5.  No inventory change occurs at import.

6.  Inventory decreases only when the user confirms shipment on the order.

# 11. Edge Case Handling

## 11.1 Partial Purchase Order Receiving

Handled natively. Each receive action applies only the quantities entered. The PO remains open for subsequent receipts until all lines are complete or the PO is manually closed.

## 11.2 Partial Order Shipments

Handled natively. Each ship action applies only the quantities entered. The order transitions through Partially Shipped until all lines are complete.

## 11.3 SKU Mismatches from Integrations

On import, any line item with an external SKU that cannot be mapped to an internal SKU is flagged as Unmatched. The order is imported but cannot be shipped until all SKUs are resolved. Resolution: user maps the external SKU to an existing internal SKU and optionally saves the mapping for future imports.

## 11.4 Inventory Discrepancies During Counts

The cycle count workflow presents a discrepancy report comparing system vs. physical counts. Users review each discrepancy individually and choose to accept (adjust system to match physical) or recount. Accepted adjustments create auditable adjustment records linked to the cycle count.

## 11.5 Damaged Inventory Requiring Value Tracking

The Manual Outbound workflow with type Damaged captures the weighted average cost at time of removal. This data supports supplier credit claims. A filtered view in Inventory Actions provides a report of all damaged outbound with date, SKU, quantity, unit cost, and total cost.

## 11.6 Manual Outbound Bypassing Integrations

All non-integration outbound (FBA, Amazon manual, samples, internal use) is handled through the Manual Outbound workflow in Inventory Actions. This ensures inventory is deducted without requiring an integration order record.

## 11.7 Negative Inventory

The system warns but does not block actions that would result in negative inventory. This is a deliberate design choice to handle situations where physical stock exists but has not yet been received into the system. Negative inventory triggers a Dashboard alert so the user can investigate and resolve the discrepancy (typically by receiving a pending PO or performing an adjustment).

## 11.8 Duplicate Integration Orders

The sync process deduplicates by external order ID. If an order with the same external ID already exists in the system, it is skipped during import. This prevents double-counting from API retries or overlapping sync windows.

## 11.9 Cost Changes Over Time

Supplier prices may change between purchase orders. Each PO line captures its own unit cost. The weighted average cost on the product record smoothly incorporates cost changes across multiple receipts. Historical cost data is preserved on receipt records and viewable per SKU.

## 11.10 Deleted or Inactive Products

Products cannot be deleted if they have any inventory on hand, open PO lines, or pending order lines. Products can be marked Inactive, which hides them from default list views and search results but preserves all historical data. Inactive products can be reactivated.

## 11.11 Incorrect Shipment: Wrong Quantity Shipped [ADDED]

Shipment records are immutable. If a user confirms a shipment with the wrong quantity, the correction uses an Inventory Adjustment rather than modifying the shipment record. This preserves the audit trail.

### 11.11.1 Correction Workflow: Over-Shipped

1.  User realizes more units were deducted than physically shipped.

2.  User navigates to Inventory Actions and selects Adjust.

3.  User selects the affected SKU and enters a positive delta to restore the excess units.

4.  User selects reason: Shipment Correction.

5.  User enters a note referencing the shipment ID (e.g., “Correction for Shipment SHP-1042: shipped 50, should have been 40”).

6.  Inventory increases by the corrected amount. The adjustment record links to the shipment for traceability.

### 11.11.2 Correction Workflow: Under-Shipped

If fewer units were physically shipped than recorded, the user follows the same adjustment workflow but enters a negative delta to remove the phantom units. Reason: Shipment Correction.

## 11.12 Incorrect Shipment: Wrong SKU Shipped [ADDED]

If the wrong SKU was shipped against an order, two adjustments are required:

1.  Positive adjustment on the SKU that was incorrectly deducted (units are still in the warehouse). Reason: Shipment Correction.

2.  Negative adjustment on the SKU that was actually shipped (units left the warehouse but were not deducted). Reason: Shipment Correction.

Both adjustments should reference the original shipment ID in their notes. The order record itself is not modified; the shipment record remains as-is for audit purposes. If the customer needs the correct product reshipped, a new manual order is created.

## 11.13 Accidental Batch Shipment [ADDED]

If a user accidentally confirms a batch shipment that included incorrect orders, the correction follows the same adjustment-based approach. For each affected order:

- Identify the SKUs and quantities that were incorrectly deducted.

- Create positive inventory adjustments to restore those quantities. Reason: Shipment Correction.

- Add notes referencing both the batch operation and the specific order ID.

The order status remains Shipped. If the order was never physically shipped and needs to be re-processed, the user creates a new manual order for the correct shipment. The system does not support un-shipping or reversing an order status, which would create ambiguity in the audit trail.

## 11.14 Adjustment Reason: Shipment Correction [ADDED]

A new reason code, Shipment Correction, is added to the Inventory Adjustment reason dropdown. This reason code allows filtering the activity log and adjustment records to see all corrections related to shipping errors. The Damaged Outbound report pattern is mirrored: a filtered view within Inventory Actions shows all Shipment Correction adjustments with date, SKU, delta, linked shipment ID, and notes.

# 12. Audit Trail

## 12.1 Principle

Every inventory-affecting action creates an immutable record. These records cannot be edited or deleted. They provide a complete audit trail for investigating discrepancies and understanding inventory movement over time.

## 12.2 Auditable Events

| **Event Type**           | **Record Created**               | **Key Fields Captured**                                    |
|--------------------------|----------------------------------|------------------------------------------------------------|
| PO Receipt               | Receipt Record                   | PO, SKU, qty, unit cost, BOL, user, timestamp              |
| Order Shipment           | Shipment Record                  | Order, SKU, qty, tracking, user, timestamp                 |
| Batch Shipment [ADDED] | Shipment Records (one per order) | Batch ID, order count, total units, user, timestamp        |
| Scan-to-Ship [ADDED]   | Shipment Record                  | Order, SKU, qty, scan session ID, user, timestamp          |
| Manual Outbound          | Outbound Record                  | Type, SKU, qty, cost (if damaged), reason, user, timestamp |
| Cycle Count              | Count Record + Adj. Records      | SKU, system qty, counted qty, variance, user, timestamp    |
| Adjustment               | Adjustment Record                | SKU, prev qty, new qty, delta, reason, user, timestamp     |
| Transfer                 | Transfer Record                  | SKU, from location, to location, user, timestamp           |

## 12.3 Activity Log

A global activity log aggregates all auditable events in chronological order. It is searchable by date range, event type, SKU, and user. The log is accessible from the Dashboard (last 25 events) and from a dedicated Activity Log view within Inventory Actions (full history with filters).

# 13. Automation Rules

The following behaviors are automated and require no user intervention:

| **Rule**                            | **Trigger**                                  | **Automated Action**                                                 |
|-------------------------------------|----------------------------------------------|----------------------------------------------------------------------|
| Order Sync                          | Configurable timer (default 15 min)          | Poll eBay and WooCommerce APIs, import new orders                    |
| SKU Matching                        | Order import                                 | Match external SKUs to internal products via mappings                |
| WAC Recalculation                   | PO receipt confirmation                      | Recalculate weighted average cost for affected SKUs                  |
| PO Status Update                    | PO receipt confirmation                      | Transition PO status based on remaining quantities                   |
| Order Status Update                 | Shipment confirmation                        | Transition order status based on remaining quantities                |
| Low Stock Alert                     | Inventory change                             | Check quantity against reorder threshold; surface alert if below     |
| Overdue PO Alert                    | Daily check                                  | Flag POs past expected delivery date with unreceived quantities      |
| Unmatched SKU Alert                 | Order import                                 | Flag line items with no internal SKU mapping                         |
| Negative Inventory Alert            | Inventory decrease                           | Flag SKUs with quantity below zero                                   |
| Inventory Value Calc                | Inventory or cost change                     | Recalculate per-SKU and total inventory value                        |
| Next Order Advance [ADDED]        | Shipment confirmation (queue mode)           | Auto-load next Pending order in queue after ship confirmation        |
| Scan-to-Ship Match [ADDED]        | Barcode scan in Scan-to-Ship mode            | Match scan to order ID or SKU; surface oldest matching pending order |
| Continuous Scan Increment [ADDED] | Duplicate SKU scan during manual order entry | Increment quantity on existing line instead of creating duplicate    |
| Today’s Work Refresh [ADDED]      | Shipment confirmation or order import        | Refresh Ready to Ship queue and Shipped Today counter in real time   |

# 14. User Interface Requirements

## 14.1 General Principles

- Minimize clicks. No action should require more than 3 clicks from the module landing page.

- Avoid multi-step wizards. Use single-screen forms with inline validation.

- Use plain operational language: Receive, Ship, Adjust, Count, Transfer, Confirm.

- Design for desktop and tablet. Minimum supported width: 1024px.

- All list views must be sortable by clicking column headers.

- All list views must support text search that filters in real time.

- Keyboard navigation must be supported for power users processing high volumes.

## 14.2 Navigation

A persistent left sidebar displays the five modules: Dashboard, Products, Purchase Orders, Orders, Inventory Actions. The active module is highlighted. No nested menus or dropdowns.

## 14.3 Confirmations

Single-click confirmation dialogs are used only for actions that modify inventory: Confirm Receipt, Confirm Shipment, Confirm Outbound, Confirm Adjustment, Finalize Count. All other actions (creating records, editing fields, saving changes) execute immediately without confirmation.

## 14.4 Search Behavior

Global search is accessible via keyboard shortcut (Ctrl+K or Cmd+K). Typing in global search filters across all SKUs and navigates to the matching product on selection. Barcode scan input in any focused search field triggers the same behavior as typing and pressing Enter.

## 14.5 Keyboard Shortcuts [ADDED]

Power users processing high volumes of orders benefit from keyboard-driven workflows. The system supports the following global shortcuts:

| **Shortcut**   | **Action**                                             |
|----------------|--------------------------------------------------------|
| Ctrl+K / Cmd+K | Open global SKU search                                 |
| Ctrl+Shift+S   | Open Scan-to-Ship mode                                 |
| Ctrl+Shift+T   | Jump to Today’s Work view on Dashboard                 |
| Enter          | Confirm current action (receipt, shipment, adjustment) |
| Escape         | Cancel current modal or exit queue/scan mode           |
| Tab            | Advance to next input field in forms                   |
| Arrow Down     | Move to next order in queue (Next Order flow)          |

Shortcuts are displayed in a help overlay accessible via the ? key. All shortcuts work in addition to mouse/touch interactions; they are accelerators, not replacements.

# 15. Non-Functional Requirements

## 15.1 Performance [MODIFIED]

- Page load time: Under 2 seconds for all module landing pages.

- Search response: Under 500ms for SKU search across 10,000 products.

- Receipt/shipment confirmation: Under 1 second for inventory update.

- Order sync: Complete import cycle in under 30 seconds for up to 100 orders.

- Next Order advance: Under 500ms to load the next order after shipment confirmation. The transition must feel instantaneous.

- Scan-to-Ship lookup: Under 300ms from scan input to order display. Any latency perceptible to the user breaks the scan rhythm.

- Batch Ship processing: Under 5 seconds for a batch of 50 orders. Progress indicator must update in real time.

- On-hand quantity display: Live values must reflect the current database state, including shipments confirmed moments earlier in the same session. Stale reads are not acceptable in shipping workflows.

## 15.2 Data Integrity

- All inventory-affecting operations must be atomic. Partial failures must roll back.

- Receipt and shipment records are immutable after creation.

- Concurrent access to the same SKU must be handled with optimistic locking to prevent race conditions.

## 15.3 Availability

- System must support 12+ hours of daily operation.

- Planned maintenance windows must not occur during business hours.

## 15.4 Data Retention

- All transaction records (receipts, shipments, adjustments, counts, outbound) are retained indefinitely.

- No automatic data purging. Archival is manual and does not delete source records.

# 16. Glossary

| **Term**            | **Definition**                                                                             |
|---------------------|--------------------------------------------------------------------------------------------|
| SKU                 | Stock Keeping Unit. The unique internal identifier for a product.                          |
| WAC                 | Weighted Average Cost. The blended unit cost calculated across all receipts.               |
| PO                  | Purchase Order. A formal order placed with a supplier for inventory.                       |
| BOL                 | Bill of Lading. A shipping document from the supplier referencing a shipment.              |
| Receipt             | The act of confirming received inventory against a purchase order.                         |
| Shipment            | The act of confirming inventory has left the warehouse for a customer order.               |
| Outbound            | Any inventory removal that is not tied to a synced customer order.                         |
| Cycle Count         | A physical inventory verification process comparing system to actual quantities.           |
| Adjustment          | A direct change to system inventory quantity with a documented reason.                     |
| Transfer            | Moving a SKU assignment from one warehouse location to another.                            |
| Integration Mapping | The link between an external platform SKU and an internal system SKU.                      |
| FBA                 | Fulfillment by Amazon. Inventory shipped to Amazon warehouses for fulfillment.             |
| Batch Ship          | Processing multiple orders as shipped in a single confirmation action.                     |
| Scan-to-Ship        | A high-speed mode where barcode scans surface and confirm orders with minimal interaction. |
| Next Order Flow     | Automatic advancement to the next pending order after shipment confirmation.               |
| Today’s Work        | Dashboard view showing all orders ready to ship, optimized for warehouse execution.        |
| Shipment Correction | An inventory adjustment reason code used to correct errors in confirmed shipments.         |
