**Technical Architecture Document**

Inventory Management System

Tech Stack, API Design, and Deployment Strategy

Version 1.0 | April 2026 | Companion to PRD v1.0 and Database Schema v1.0

| Document Owner | TBD                                                  |
|----------------|------------------------------------------------------|
| Status         | Draft                                                |
| Last Updated   | April 4, 2026                                        |
| Prerequisites  | PRD v1.0 (approved), Database Schema v1.0 (approved) |

# Table of Contents

[Table of Contents](#table-of-contents)

[1. Tech Stack](#tech-stack)

[1.1 Backend: Node.js with Express](#backend-node.js-with-express)

[1.1.1 Choice](#choice)

[1.1.2 Rationale](#rationale)

[1.1.3 Alternatives Rejected](#alternatives-rejected)

[1.2 Frontend: React with Vite](#frontend-react-with-vite)

[1.2.1 Choice](#choice-1)

[1.2.2 Rationale](#rationale-1)

[1.2.3 Key Frontend Libraries](#key-frontend-libraries)

[1.2.4 Why Not Server-Side Rendering](#why-not-server-side-rendering)

[1.3 Database: PostgreSQL](#database-postgresql)

[1.3.1 Choice](#choice-2)

[1.3.2 Rationale](#rationale-2)

[1.3.3 Alternatives Rejected](#alternatives-rejected-1)

[1.4 Hosting: Single VPS with Docker Compose](#hosting-single-vps-with-docker-compose)

[1.4.1 Choice](#choice-3)

[1.4.2 Rationale](#rationale-3)

[1.4.3 Infrastructure Diagram (Text)](#infrastructure-diagram-text)

[1.4.4 Why Not Cloud-Managed Services](#why-not-cloud-managed-services)

[1.5 Authentication: Session-Based with Simple Login](#authentication-session-based-with-simple-login)

[1.5.1 Choice](#choice-4)

[1.5.2 Rationale](#rationale-4)

[1.5.3 Session Configuration](#session-configuration)

[2. System Architecture](#system-architecture)

[2.1 High-Level Data Flow](#high-level-data-flow)

[2.1.1 Request Lifecycle](#request-lifecycle)

[2.2 Application Layer Structure](#application-layer-structure)

[2.3 Module Interaction](#module-interaction)

[2.3.1 Shared Services](#shared-services)

[2.3.2 The inventoryService Contract](#the-inventoryservice-contract)

[2.4 Safe Inventory Updates](#safe-inventory-updates)

[3. API Design](#api-design)

[3.1 Common Patterns](#common-patterns)

[3.1.1 Pagination](#pagination)

[3.1.2 Filtering and Search](#filtering-and-search)

[3.1.3 Error Response Format](#error-response-format)

[3.2 Products](#products)

[3.3 Purchase Orders](#purchase-orders)

[3.4 Receiving](#receiving)

[3.5 Orders](#orders)

[3.6 Shipments](#shipments)

[3.7 Manual Outbound](#manual-outbound)

[3.8 Inventory Adjustments](#inventory-adjustments)

[3.9 Cycle Counts](#cycle-counts)

[3.10 Transfers](#transfers)

[3.11 Dashboard](#dashboard)

[4. Real-Time Behavior](#real-time-behavior)

[4.1 TanStack Query as the Real-Time Engine](#tanstack-query-as-the-real-time-engine)

[4.1.1 Cache Invalidation Rules](#cache-invalidation-rules)

[4.1.2 Stale Time Configuration](#stale-time-configuration)

[4.2 Scan-to-Ship Responsiveness](#scan-to-ship-responsiveness)

[4.3 Avoiding Stale Data in Shipping Workflows](#avoiding-stale-data-in-shipping-workflows)

[5. Concurrency Handling](#concurrency-handling)

[5.1 Conflict Scenario](#conflict-scenario)

[5.2 Optimistic Locking Mechanism](#optimistic-locking-mechanism)

[5.3 Retry Logic](#retry-logic)

[5.4 Batch Shipment Concurrency](#batch-shipment-concurrency)

[5.5 Why Not Pessimistic Locking](#why-not-pessimistic-locking)

[6. Integration Layer](#integration-layer)

[6.1 Architecture Overview](#architecture-overview)

[6.1.1 Why Polling, Not Webhooks](#why-polling-not-webhooks)

[6.2 eBay Sync](#ebay-sync)

[6.2.1 Authentication](#authentication)

[6.2.2 Sync Cycle](#sync-cycle)

[6.2.3 Rate Limiting](#rate-limiting)

[6.3 WooCommerce Sync](#woocommerce-sync)

[6.3.1 Authentication](#authentication-1)

[6.3.2 Sync Cycle](#sync-cycle-1)

[6.3.3 Pagination](#pagination-1)

[6.4 Error Handling](#error-handling)

[6.4.1 Transient Errors](#transient-errors)

[6.4.2 Data Errors](#data-errors)

[6.4.3 Sync State Recovery](#sync-state-recovery)

[7. Deployment Strategy](#deployment-strategy)

[7.1 Local Development Setup](#local-development-setup)

[7.1.1 Prerequisites](#prerequisites)

[7.1.2 Getting Started](#getting-started)

[7.1.3 Local Architecture](#local-architecture)

[7.2 Production Deployment](#production-deployment)

[7.2.1 Server Specification](#server-specification)

[7.2.2 Docker Compose Production File](#docker-compose-production-file)

[7.2.3 Deployment Procedure](#deployment-procedure)

[7.2.4 Health Check Endpoint](#health-check-endpoint)

[7.3 Database Migrations](#database-migrations)

[7.4 Backup Strategy](#backup-strategy)

[7.4.1 Automated Backups](#automated-backups)

[7.4.2 Restore Procedure](#restore-procedure)

[7.5 Monitoring](#monitoring)

[7.6 MVP Scope and Phased Delivery](#mvp-scope-and-phased-delivery)

[7.6.1 Phase 1: Core Operations (MVP)](#phase-1-core-operations-mvp)

[7.6.2 Phase 2: Speed and Integration](#phase-2-speed-and-integration)

[8. Security](#security)

[8.1 Transport](#transport)

[8.2 Authentication](#authentication-2)

[8.3 Input Validation](#input-validation)

[8.4 Environment Variables](#environment-variables)

[8.5 Network](#network)

[9. Decision Log](#decision-log)

# 1. Tech Stack

Every technology choice is evaluated against three criteria: simplicity (least moving parts), speed (for both development and runtime), and reliability (for a single-company production system processing hundreds of SKUs daily). Enterprise-grade complexity is explicitly rejected.

## 1.1 Backend: Node.js with Express

### 1.1.1 Choice

Node.js (LTS) with the Express framework, using TypeScript for type safety.

### 1.1.2 Rationale

- Single language across frontend and backend. The development team writes TypeScript everywhere, eliminating context-switching and enabling shared type definitions between API and UI.

- Express is the most mature, least opinionated Node.js framework. It adds almost no abstraction over raw HTTP. Developers can read any Express route and understand exactly what it does without framework-specific knowledge.

- Non-blocking I/O is a natural fit for the integration sync layer, which polls two external APIs on a timer. Node handles this natively without thread pool management.

- The ecosystem provides production-grade libraries for every required integration: PostgreSQL drivers (pg), eBay and WooCommerce API clients, barcode handling, and job scheduling.

- For a single-tenant system with one to five concurrent users, Node.js has more than sufficient throughput. There is no compute-intensive work that would benefit from multi-threaded runtimes.

### 1.1.3 Alternatives Rejected

| **Alternative**         | **Rejection Reason**                                                                             |
|-------------------------|--------------------------------------------------------------------------------------------------|
| Django / Flask (Python) | Adds a second language. No compelling advantage for this workload.                               |
| NestJS                  | Heavy abstraction layer (decorators, DI, modules). Overkill for a 5-module system.               |
| Fastify                 | Marginal perf gain over Express; smaller ecosystem and community for troubleshooting.            |
| Go / Rust               | Faster runtime but slower development for CRUD-heavy applications. Single-language benefit lost. |

## 1.2 Frontend: React with Vite

### 1.2.1 Choice

React 18+ with Vite as the build tool, TypeScript, and Tailwind CSS for styling. Single-page application (SPA) architecture.

### 1.2.2 Rationale

- React is the dominant frontend framework with the largest talent pool. If the team needs to hire, React developers are the easiest to find.

- SPA architecture eliminates full page reloads between modules, which is critical for the Next Order Flow and Scan-to-Ship workflows where transitions must feel instantaneous.

- Vite provides sub-second hot module replacement during development and fast production builds. It replaces Create React App and Webpack with zero configuration.

- Tailwind CSS eliminates custom CSS files. Styling is co-located with components. The utility-first approach produces a consistent visual language without a dedicated design system.

- React’s component model maps cleanly to the system’s modules: Dashboard, Products, PurchaseOrders, Orders, and InventoryActions are top-level route components with shared UI primitives (tables, forms, modals).

### 1.2.3 Key Frontend Libraries

| **Library**                  | **Purpose**                                                       |
|------------------------------|-------------------------------------------------------------------|
| React Router                 | Client-side routing for the 5 modules and sub-views               |
| TanStack Query (React Query) | Server state management, caching, automatic refetching            |
| Zustand                      | Lightweight client state (Scan-to-Ship session, UI preferences)   |
| React Hook Form              | Form handling for PO creation, order entry, adjustments           |
| React Hot Toast              | Non-blocking success/error notifications (shipment confirmations) |
| Headless UI or Radix         | Accessible dropdown, dialog, and combobox primitives              |

### 1.2.4 Why Not Server-Side Rendering

This is an internal operations tool, not a public website. There is no SEO requirement, no need for first-paint optimization for strangers on slow connections, and no benefit from server-rendered HTML. An SPA provides the fastest possible in-app navigation, which directly serves the PRD’s speed-first mandate.

## 1.3 Database: PostgreSQL

### 1.3.1 Choice

PostgreSQL 16+, single instance. No ORM; queries are written using a query builder (Knex.js) for clarity and control.

### 1.3.2 Rationale

- PostgreSQL is the most capable open-source relational database. It handles the schema’s transactional requirements (atomic multi-table writes, optimistic locking, partial indexes, foreign key enforcement) natively and reliably.

- The database schema uses standard SQL features: BIGINT PKs, DECIMAL for currency, TIMESTAMPTZ, partial indexes, composite unique constraints. PostgreSQL supports all of these without workarounds.

- For a single-tenant system with under 10 million rows across all tables after 5 years, a single PostgreSQL instance handles the load with massive headroom. No sharding, no replication, no distributed database complexity.

- Knex.js is used instead of a full ORM (Sequelize, Prisma) because: the schema is already fully designed, the transaction flows are explicitly defined, and the team needs precise control over query structure. Knex provides parameterized query building without the abstraction tax of an ORM’s model layer.

### 1.3.3 Alternatives Rejected

| **Alternative** | **Rejection Reason**                                                                                                    |
|-----------------|-------------------------------------------------------------------------------------------------------------------------|
| MySQL / MariaDB | Weaker support for partial indexes, TIMESTAMPTZ, and transactional DDL. No compelling advantage.                        |
| SQLite          | Single-writer limitation would bottleneck batch shipments. No network access for future flexibility.                    |
| MongoDB         | Document model is a poor fit for relational inventory data. No ACID transactions across collections without complexity. |
| Prisma ORM      | Adds a migration DSL, generated client, and abstraction over raw SQL. Unnecessary overhead for a fully designed schema. |

## 1.4 Hosting: Single VPS with Docker Compose

### 1.4.1 Choice

A single Linux VPS (e.g., DigitalOcean Droplet, Hetzner Cloud, or AWS Lightsail) running Docker Compose with three containers: the Node.js application, PostgreSQL, and an Nginx reverse proxy.

### 1.4.2 Rationale

- Single-company, single-tenant, low-concurrency system. Kubernetes, ECS, serverless, and multi-region architectures are unjustifiable overhead. A \$20–40/month VPS with 4 vCPUs and 8 GB RAM handles this workload with headroom to spare.

- Docker Compose provides reproducible deployments. The entire system starts with docker compose up. Dev, staging, and production all use the same compose file with environment-specific overrides.

- Nginx handles TLS termination, static file serving (the React SPA build), and reverse proxying API requests to the Node.js container. This is a standard, battle-tested pattern.

- Backups are a cron job that runs pg_dump daily and uploads the compressed dump to an off-site location (S3 bucket or equivalent). Simple, reliable, and easy to restore from.

### 1.4.3 Infrastructure Diagram (Text)

> [Browser / Tablet]
>
> |
>
> | HTTPS
>
> v
>
> [Nginx Container] <-- serves React SPA static files
>
> |
>
> | /api/* proxy_pass
>
> v
>
> [Node.js Container] <-- Express API + sync scheduler
>
> |
>
> | TCP 5432
>
> v
>
> [PostgreSQL Container] <-- persistent volume
>
> [Cron / pg_dump] --> [Off-site Backup Storage]

### 1.4.4 Why Not Cloud-Managed Services

Managed databases (RDS, Cloud SQL) and managed container services (ECS, Cloud Run) add cost and operational complexity (IAM policies, VPC configuration, security groups) that is not justified for a single-company system. If the business grows to require high availability or multi-region, the migration path from Docker Compose to a managed platform is straightforward because the application is containerized from day one.

## 1.5 Authentication: Session-Based with Simple Login

### 1.5.1 Choice

Server-side sessions stored in PostgreSQL (via connect-pg-simple), with a standard username/password login form. No OAuth, no SSO, no third-party auth provider.

### 1.5.2 Rationale

- The PRD specifies a single user role (Admin) with all users trusted. There is no permissions model, no role hierarchy, and no public-facing registration. Authentication exists solely to prevent unauthorized network access, not to differentiate user capabilities.

- Session-based auth is simpler to implement and debug than JWT. Sessions are revocable (delete the row), inspectable (query the sessions table), and do not require token refresh logic on the frontend.

- Storing sessions in PostgreSQL reuses the existing database. No Redis instance is needed. For under 10 concurrent users, PostgreSQL session lookup adds negligible overhead.

- User accounts are created by an existing admin via a simple user management screen. No self-registration. Password hashing uses bcrypt with a cost factor of 12.

### 1.5.3 Session Configuration

| **Setting**         | **Value**                         | **Rationale**                                               |
|---------------------|-----------------------------------|-------------------------------------------------------------|
| Session lifetime    | 12 hours                          | Matches a full warehouse shift without re-login             |
| Cookie flags        | httpOnly, secure, sameSite=strict | Standard security best practices                            |
| Inactivity timeout  | 2 hours                           | Auto-logout if user walks away from terminal                |
| Concurrent sessions | Unlimited per user                | Users may be logged in on desktop and tablet simultaneously |

# 2. System Architecture

## 2.1 High-Level Data Flow

The system follows a standard three-tier architecture with a clear separation between presentation, business logic, and data storage.

### 2.1.1 Request Lifecycle

1.  User interacts with the React SPA in the browser (clicks Ship, scans a barcode, submits a form).

2.  React component calls a TanStack Query mutation or query, which sends an HTTP request to the Express API.

3.  Nginx reverse proxy routes /api/* requests to the Node.js container.

4.  Express middleware authenticates the session, validates the request body, and routes to the appropriate controller.

5.  The controller calls a service function that encapsulates the business logic (e.g., confirmShipment).

6.  The service function opens a database transaction via Knex, executes the multi-table writes defined in the Database Schema document (Section 4), and commits.

7.  On commit, the service returns the result to the controller, which sends the HTTP response.

8.  TanStack Query receives the response, updates the cache, and React re-renders the affected components.

## 2.2 Application Layer Structure

The Node.js application is organized into four layers. Each layer has a single responsibility and a clear dependency direction: routes depend on controllers, controllers depend on services, services depend on the database.

| **Layer**       | **Responsibility**                                                           | **Examples**                                                       |
|-----------------|------------------------------------------------------------------------------|--------------------------------------------------------------------|
| Routes          | HTTP method + path mapping. No logic.                                        | /api/orders/:id/ship maps to shipmentsController.confirm           |
| Controllers     | Request parsing, input validation, response formatting. Calls service layer. | Parse body, validate required fields, return 200/400/409           |
| Services        | Business logic and database transactions. All inventory writes happen here.  | confirmShipment(), receiveInventory(), adjustInventory()           |
| Database (Knex) | Query execution. Raw SQL via Knex query builder. No ORM models.              | knex('products').where('id', productId).update({qty_on_hand: ...}) |

## 2.3 Module Interaction

The five PRD modules (Dashboard, Products, Purchase Orders, Orders, Inventory Actions) are implemented as feature folders in both frontend and backend. On the backend, they share services through explicit imports, not through event buses or message queues.

### 2.3.1 Shared Services

| **Service**      | **Used By**                                                         | **Purpose**                                                                          |
|------------------|---------------------------------------------------------------------|--------------------------------------------------------------------------------------|
| inventoryService | PO receiving, shipments, manual outbound, adjustments, cycle counts | Atomic qty_on_hand update + ledger write. Single function for all inventory changes. |
| costService      | PO receiving                                                        | WAC recalculation on receipt. Called by inventoryService during inbound.             |
| productService   | All modules                                                         | Product lookup by ID, SKU, or barcode. Shared read operations.                       |
| syncService      | Orders module, scheduler                                            | eBay and WooCommerce order import. Runs on timer and manual trigger.                 |

### 2.3.2 The inventoryService Contract

Every inventory quantity change in the entire system flows through a single function: inventoryService.applyDelta(). This function accepts a product ID, a quantity delta (positive or negative), an event type, a source reference, and the performing user. Within a transaction, it updates products.qty_on_hand and inserts an inventory_ledger row. No other code in the application is permitted to modify qty_on_hand directly. This single-point-of-entry design guarantees that the ledger and the stored quantity can never diverge due to a code path that forgets to write the ledger.

## 2.4 Safe Inventory Updates

All inventory writes follow the transaction flow patterns defined in Database Schema v1.0, Section 4. The critical safety mechanisms are:

- Atomic transactions: Every inventory-affecting operation is wrapped in a Knex transaction (knex.transaction()). If any step fails, all writes roll back. There is no partial state.

- Single entry point: inventoryService.applyDelta() is the only function that touches products.qty_on_hand. This is enforced by code review convention and linting rules.

- Optimistic locking: applyDelta() uses UPDATE products SET qty_on_hand = qty_on_hand + :delta, updated_at = NOW() WHERE id = :id AND updated_at = :expected. If updated_at has changed (concurrent modification), the update affects zero rows, the service throws a ConcurrencyConflictError, and the controller returns HTTP 409.

- Idempotency keys: Batch shipment and manual outbound operations generate a unique batch_id or request_id. If a request is retried (e.g., network timeout), the service checks for an existing record with the same key and returns the previous result instead of double-processing.

# 3. API Design

The API follows REST conventions. All endpoints are prefixed with /api/v1. Requests and responses use JSON. Authentication is required for all endpoints (session cookie). Standard HTTP status codes are used: 200 (success), 201 (created), 400 (validation error), 404 (not found), 409 (concurrency conflict), 500 (server error).

## 3.1 Common Patterns

### 3.1.1 Pagination

All list endpoints support cursor-based pagination via query parameters: ?limit=50&after=<last_id>. Default limit is 50, maximum is 200. Response includes a next_cursor field if more results exist.

### 3.1.2 Filtering and Search

List endpoints accept query parameters for filtering: ?status=pending&source=ebay&search=BOX-12. The search parameter performs a case-insensitive prefix match across relevant text fields (SKU, product name, order number).

### 3.1.3 Error Response Format

> { "error": { "code": "VALIDATION_ERROR",
>
> "message": "Shipped qty exceeds ordered qty",
>
> "field": "lines[0].shipped_qty" } }

## 3.2 Products

| **Method** | **Endpoint**                      | **Purpose**                            | **Key Payload / Response**                                                  |
|------------|-----------------------------------|----------------------------------------|-----------------------------------------------------------------------------|
| GET        | /products                         | List products (filterable, searchable) | Query: status, category, location, search. Returns: paginated product list. |
| GET        | /products/:id                     | Get product detail                     | Returns: full product record + integration mappings + cost history summary. |
| POST       | /products                         | Create product                         | Body: sku, product_name, barcode, category, reorder_threshold, location.    |
| PATCH      | /products/:id                     | Update product                         | Body: any mutable field. Cannot change sku.                                 |
| GET        | /products/:id/cost-history        | Get receipt-level cost history         | Returns: array of {unit_cost, received_qty, receipt_date, po_number, bol}.  |
| GET        | /products/:id/ledger              | Get inventory change history           | Returns: paginated ledger entries for this product.                         |
| POST       | /products/:id/mappings            | Add integration mapping                | Body: platform, external_sku, external_name.                                |
| DELETE     | /products/:id/mappings/:mappingId | Remove integration mapping             | Deletes the mapping row.                                                    |
| GET        | /products/lookup?barcode=X        | Barcode lookup                         | Returns: single product matching barcode, or 404.                           |

## 3.3 Purchase Orders

| **Method** | **Endpoint**               | **Purpose**                   | **Key Payload / Response**                                                               |
|------------|----------------------------|-------------------------------|------------------------------------------------------------------------------------------|
| GET        | /purchase-orders           | List POs (filterable)         | Query: status, supplier, search.                                                         |
| GET        | /purchase-orders/:id       | Get PO detail with line items | Returns: PO header + line items with received_qty + receipt history.                     |
| POST       | /purchase-orders           | Create PO                     | Body: po_number, supplier, expected_date, lines[{product_id, ordered_qty, unit_cost}]. |
| PATCH      | /purchase-orders/:id       | Update PO header              | Body: supplier, expected_date, notes. Cannot change lines after first receipt.           |
| POST       | /purchase-orders/:id/close | Manually close PO             | Transitions status to closed. No further receipts allowed.                               |

## 3.4 Receiving

| **Method** | **Endpoint**                  | **Purpose**                | **Key Payload / Response**                                                                            |
|------------|-------------------------------|----------------------------|-------------------------------------------------------------------------------------------------------|
| POST       | /purchase-orders/:id/receive  | Confirm receipt against PO | Body: bol_number, lines[{po_line_item_id, received_qty}]. Triggers inventory increase + WAC recalc. |
| GET        | /purchase-orders/:id/receipts | List receipts for a PO     | Returns: array of receipt headers with line details.                                                  |
| GET        | /receipts/:id                 | Get single receipt detail  | Returns: receipt header + line items with unit costs.                                                 |

**Critical:** POST /purchase-orders/:id/receive is the only endpoint that increases inventory. It executes Transaction Flow 4.1 from the Database Schema within a single atomic transaction.

## 3.5 Orders

| **Method** | **Endpoint**                           | **Purpose**                      | **Key Payload / Response**                                                                                     |
|------------|----------------------------------------|----------------------------------|----------------------------------------------------------------------------------------------------------------|
| GET        | /orders                                | List orders (filterable)         | Query: status, source, search, ready_to_ship (boolean shortcut for pending+partially_shipped).                 |
| GET        | /orders/:id                            | Get order detail with line items | Returns: order header + line items (with is_matched, current qty_on_hand per SKU) + shipment history.          |
| POST       | /orders                                | Create manual order              | Body: customer_name, order_date, lines[{product_id, ordered_qty}]. Source = manual.                          |
| PATCH      | /orders/:id/cancel                     | Cancel order                     | Transitions to cancelled. No inventory change.                                                                 |
| POST       | /orders/sync                           | Trigger manual sync              | Runs eBay + WooCommerce sync immediately. Returns: {imported: N, errors: N}.                                   |
| PATCH      | /orders/:orderId/lines/:lineId/resolve | Resolve unmatched SKU            | Body: product_id, save_mapping (boolean). Links line to product, optionally creates mapping.                   |
| GET        | /orders/today                          | Today’s Work queue               | Returns: orders with status pending/partially_shipped, sorted oldest first. Includes qty_on_hand per line SKU. |

## 3.6 Shipments

| **Method** | **Endpoint**               | **Purpose**                 | **Key Payload / Response**                                                                                  |
|------------|----------------------------|-----------------------------|-------------------------------------------------------------------------------------------------------------|
| POST       | /orders/:id/ship           | Confirm shipment            | Body: tracking_number, lines[{order_line_item_id, shipped_qty}]. Triggers inventory deduction.            |
| POST       | /orders/batch-ship         | Batch ship multiple orders  | Body: order_ids[], tracking_prefix. Ships all at full qty. Returns: {shipped: N, failed: N, details[]}. |
| GET        | /orders/:id/shipments      | List shipments for an order | Returns: array of shipment headers with line details.                                                       |
| GET        | /orders/scan-lookup?code=X | Scan-to-Ship lookup         | Query: barcode or order number. Returns: matching pending order(s) with line details and qty_on_hand.       |

**Critical:** POST /orders/:id/ship is the primary inventory deduction endpoint. POST /orders/batch-ship wraps multiple individual shipments in a single database transaction.

## 3.7 Manual Outbound

| **Method** | **Endpoint**                    | **Purpose**              | **Key Payload / Response**                                                                           |
|------------|---------------------------------|--------------------------|------------------------------------------------------------------------------------------------------|
| POST       | /manual-outbound                | Confirm manual outbound  | Body: outbound_type, reason_text, reference_number, lines[{product_id, qty}]. Deducts immediately. |
| GET        | /manual-outbound                | List outbound records    | Query: outbound_type, date range. Returns: paginated outbound headers.                               |
| GET        | /manual-outbound/:id            | Get outbound detail      | Returns: header + lines with unit_cost_snapshot.                                                     |
| GET        | /manual-outbound/damaged-report | Damaged inventory report | Returns: filtered view of damaged outbound with cost totals.                                         |

## 3.8 Inventory Adjustments

| **Method** | **Endpoint**     | **Purpose**           | **Key Payload / Response**                                                    |
|------------|------------------|-----------------------|-------------------------------------------------------------------------------|
| POST       | /adjustments     | Confirm adjustment    | Body: product_id, new_qty OR qty_delta, reason, notes. Updates qty_on_hand.   |
| GET        | /adjustments     | List adjustments      | Query: reason, product_id, date range. Returns: paginated adjustment records. |
| GET        | /adjustments/:id | Get adjustment detail | Returns: full adjustment record with previous_qty, new_qty, delta.            |

## 3.9 Cycle Counts

| **Method** | **Endpoint**                    | **Purpose**            | **Key Payload / Response**                                                                       |
|------------|---------------------------------|------------------------|--------------------------------------------------------------------------------------------------|
| POST       | /cycle-counts                   | Create new count       | Body: scope_type, scope_value, product_ids[] (for custom). System qty is hidden from response. |
| GET        | /cycle-counts/:id               | Get count with lines   | Returns: count header + lines. Hides system_qty until status = completed.                        |
| PATCH      | /cycle-counts/:id/lines/:lineId | Enter counted quantity | Body: counted_qty. Calculates variance server-side.                                              |
| POST       | /cycle-counts/:id/review        | Enter review mode      | Returns: discrepancy report with system_qty, counted_qty, variance per line.                     |
| POST       | /cycle-counts/:id/finalize      | Finalize count         | Body: accepted_line_ids[]. Creates adjustments for accepted discrepancies. Atomic transaction. |
| GET        | /cycle-counts                   | List counts            | Query: status, date range. Returns: paginated count headers with summary stats.                  |

## 3.10 Transfers

| **Method** | **Endpoint** | **Purpose**      | **Key Payload / Response**                                          |
|------------|--------------|------------------|---------------------------------------------------------------------|
| POST       | /transfers   | Confirm transfer | Body: product_id, to_location. Updates products.location.           |
| GET        | /transfers   | List transfers   | Query: product_id, date range. Returns: paginated transfer records. |

## 3.11 Dashboard

| **Method** | **Endpoint**        | **Purpose**             | **Key Payload / Response**                                                                |
|------------|---------------------|-------------------------|-------------------------------------------------------------------------------------------|
| GET        | /dashboard/summary  | Inventory summary panel | Returns: total_skus, total_units, total_value, received_today, shipped_today.             |
| GET        | /dashboard/alerts   | Active alerts           | Returns: low_stock[], unmatched_skus[], overdue_pos[], negative_inventory[].      |
| GET        | /dashboard/activity | Recent activity feed    | Query: limit (default 25). Returns: latest ledger entries with human-readable references. |

# 4. Real-Time Behavior

The system does not require WebSockets or server-sent events. Real-time responsiveness is achieved through TanStack Query’s cache management and targeted refetching. This approach is simpler, more reliable, and sufficient for a system with one to five concurrent users.

## 4.1 TanStack Query as the Real-Time Engine

TanStack Query manages all server state on the frontend. Every API response is cached with a configurable stale time. When a mutation succeeds (e.g., confirming a shipment), the library automatically invalidates related queries, triggering a refetch. This is the mechanism that makes inventory updates appear instantly without polling or push.

### 4.1.1 Cache Invalidation Rules

| **Mutation**       | **Invalidated Queries**                                           | **Effect**                                                                |
|--------------------|-------------------------------------------------------------------|---------------------------------------------------------------------------|
| Confirm Shipment   | orders, orders/:id, orders/today, dashboard/summary, products/:id | Today’s Work queue updates, shipped counts refresh, product qty refreshes |
| Confirm Receipt    | purchase-orders/:id, dashboard/summary, products/:id              | PO status updates, received counts refresh, product qty and WAC refresh   |
| Confirm Outbound   | dashboard/summary, products/:id, manual-outbound                  | Inventory totals update, product qty refreshes                            |
| Confirm Adjustment | dashboard/summary, products/:id, adjustments                      | Inventory totals and product detail refresh                               |
| Batch Ship         | orders, orders/today, dashboard/summary, products                 | Broad invalidation: entire order list and all product qtys                |
| Order Sync         | orders, orders/today, dashboard/alerts                            | New orders appear in queue, unmatched SKU alerts surface                  |

### 4.1.2 Stale Time Configuration

| **Query Category**      | **Stale Time** | **Rationale**                                                                        |
|-------------------------|----------------|--------------------------------------------------------------------------------------|
| Product list and detail | 30 seconds     | Balances freshness with server load. Invalidated on mutations anyway.                |
| Orders / Today’s Work   | 15 seconds     | Shipping queue must stay current. Short stale time + mutation invalidation.          |
| Dashboard summary       | 15 seconds     | Counters should reflect recent activity without aggressive polling.                  |
| Dashboard alerts        | 60 seconds     | Alerts change infrequently. Mutation invalidation handles sync-triggered changes.    |
| Ledger / cost history   | 5 minutes      | Historical data changes only when new events occur; mutation invalidation covers it. |

## 4.2 Scan-to-Ship Responsiveness

Scan-to-Ship requires sub-300ms lookup from barcode scan to order display. This is achieved through:

- Dedicated endpoint: GET /orders/scan-lookup?code=X performs a single indexed query. It first checks orders.order_number and orders.external_order_id, then falls back to a join through order_line_items.product_id via the products.barcode index. The query uses the composite index on orders(status, order_date) to restrict to pending orders only.

- Pre-warmed connection pool: The Knex connection pool maintains a minimum of 2 open connections, eliminating connection establishment latency on the first scan of a session.

- Minimal response payload: The scan-lookup endpoint returns only the fields needed for the Scan-to-Ship confirmation form: order ID, order number, line items (SKU, name, ordered qty, shipped qty, remaining qty), and current qty_on_hand per SKU. No extraneous data.

- No cache dependency: Scan-to-Ship always hits the database. This avoids showing stale orders that were already shipped moments earlier by another user or in a previous scan.

## 4.3 Avoiding Stale Data in Shipping Workflows

The PRD requires that qty_on_hand displayed during shipping reflects the true current value, including shipments confirmed moments earlier. This is handled by:

- Server-side qty_on_hand: Every shipping-related endpoint (order detail, scan-lookup, today’s work) includes the current qty_on_hand from the database in its response. The frontend does not calculate or cache qty_on_hand independently.

- Mutation-driven refresh: After confirming a shipment (which deducts inventory), TanStack Query invalidates the product cache. The next order in the Next Order Flow loads fresh product data from the server, which reflects the just-committed deduction.

- No client-side qty math: The frontend never decrements a cached qty_on_hand after a shipment. It always fetches the authoritative value from the server. This eliminates an entire class of stale-data bugs.

# 5. Concurrency Handling

With one to five concurrent users in a single warehouse, concurrency conflicts are infrequent but must be handled correctly when they occur. The system uses optimistic concurrency control, which avoids lock contention during normal operations and degrades gracefully under conflict.

## 5.1 Conflict Scenario

The primary conflict scenario: two users ship orders containing the same SKU at the same moment. Without protection, both transactions read the same qty_on_hand (e.g., 100), both decrement by their shipped quantity, and the final qty_on_hand reflects only one deduction instead of both.

## 5.2 Optimistic Locking Mechanism

The inventoryService.applyDelta() function implements optimistic locking on the products row:

1.  The service reads the current updated_at timestamp from the products row.

2.  The service executes: UPDATE products SET qty_on_hand = qty_on_hand + :delta, updated_at = NOW() WHERE id = :id AND updated_at = :read_timestamp.

3.  If the UPDATE affects 1 row: success. The row has not been modified since it was read.

4.  If the UPDATE affects 0 rows: another transaction modified the row between the read and the write. The service throws a ConcurrencyConflictError.

## 5.3 Retry Logic

When a ConcurrencyConflictError is thrown:

1.  The entire database transaction is rolled back. No partial writes persist.

2.  The service retries the operation from scratch: re-reads the current products row, recalculates if necessary, and re-attempts the transaction.

3.  Maximum retries: 3. Retry delay: 50ms, 100ms, 200ms (exponential backoff).

4.  If all retries fail, the controller returns HTTP 409 to the frontend with a message indicating a temporary conflict.

5.  The frontend displays a non-blocking toast: “Inventory was updated by another user. Please retry.” The user clicks Confirm again.

## 5.4 Batch Shipment Concurrency

Batch shipments process multiple orders in a single wrapping transaction. Because a batch may touch many product rows, the risk of an optimistic lock conflict increases. To mitigate this:

- Product rows are updated in deterministic order (sorted by product ID) to prevent deadlocks between competing transactions.

- If any single product update within the batch hits an optimistic lock conflict, the entire batch rolls back and retries from scratch (up to 3 attempts).

- For very large batches (50+ orders), the system logs each retry with the conflicting product ID for operational visibility.

## 5.5 Why Not Pessimistic Locking

Pessimistic locking (SELECT ... FOR UPDATE) would eliminate retries by holding a row-level lock during the entire transaction. However, for this system, the additional lock contention and potential for long-held locks during slow transactions (e.g., a batch of 50 orders) would degrade overall throughput. With one to five users and hundreds of SKUs, optimistic lock conflicts are rare enough that the retry cost is negligible, while the throughput benefit of lock-free reads is significant.

# 6. Integration Layer

## 6.1 Architecture Overview

The integration layer is a backend service (syncService) that runs inside the same Node.js process as the API. It does not require a separate worker, message queue, or microservice. It is triggered by a timer (node-cron) and by explicit API calls.

### 6.1.1 Why Polling, Not Webhooks

| **Factor**     | **Polling**                                                                | **Webhooks**                                                               |
|----------------|----------------------------------------------------------------------------|----------------------------------------------------------------------------|
| Infrastructure | No public endpoint needed. Works behind NAT/firewall.                      | Requires a public HTTPS endpoint, TLS cert, and firewall rules.            |
| Reliability    | Runs on schedule regardless of platform outages. Catches up automatically. | Missed webhook = missed order unless retry/replay is built.                |
| Complexity     | Simple loop: fetch new orders, import, sleep.                              | Webhook receiver, signature verification, dedup, replay for missed events. |
| Latency        | 15-minute delay between order placed and imported.                         | Near-instant (seconds).                                                    |
| Verdict        | Acceptable for this use case.                                              | Unnecessary complexity for a 15-min acceptable delay.                      |

A 15-minute sync interval is acceptable because orders are not shipped the moment they arrive. They queue in the system until a warehouse user processes them. The difference between importing an order at 10:00 and 10:15 does not affect operational outcomes.

## 6.2 eBay Sync

### 6.2.1 Authentication

eBay uses OAuth 2.0 with a long-lived refresh token. The system stores the encrypted refresh token in an environment variable. On each sync cycle, if the access token is expired, the service refreshes it automatically via the eBay OAuth API. Token refresh failures trigger an alert on the Dashboard.

### 6.2.2 Sync Cycle

1.  Scheduler fires every 15 minutes (configurable).

2.  Service calls eBay GetOrders API with a filter for orders modified since the last successful sync timestamp (stored in a sync_state key-value table or application config).

3.  For each returned order: check if external_order_id already exists in orders table. If yes, skip (dedup).

4.  If new: create order record with source = ebay. For each line item, attempt SKU matching via product_integration_mappings.

5.  If match found: set product_id, is_matched = true.

6.  If no match: set product_id = NULL, is_matched = false. Store external_sku and item title.

7.  Update last_sync_timestamp to the current time.

8.  Log sync result: orders imported, orders skipped (dedup), SKUs unmatched.

### 6.2.3 Rate Limiting

eBay API enforces call limits per day. The sync service respects rate limit headers (X-EBAY-C-RATE-LIMIT-REMAINING). If the remaining calls drop below a safety threshold (100), the service skips the current cycle and logs a warning. This prevents sync failures due to rate exhaustion.

## 6.3 WooCommerce Sync

### 6.3.1 Authentication

WooCommerce uses API key authentication (consumer key + consumer secret) passed as query parameters or Basic Auth. Credentials are stored as environment variables.

### 6.3.2 Sync Cycle

Identical flow to eBay sync (Section 6.2.2), adapted for the WooCommerce REST API. The service calls GET /wp-json/wc/v3/orders?status=processing&after=:last_sync_timestamp. Deduplication, SKU matching, and error handling are the same.

### 6.3.3 Pagination

WooCommerce API returns paginated results. The sync service follows pagination headers (X-WP-TotalPages) and fetches all pages in a single sync cycle. For a typical business, the number of new orders per 15-minute window is small enough (under 50) that pagination is rarely needed, but the implementation handles it correctly.

## 6.4 Error Handling

### 6.4.1 Transient Errors

| **Error Type**            | **Handling**                                                                    | **Retry**                                |
|---------------------------|---------------------------------------------------------------------------------|------------------------------------------|
| Network timeout           | Log warning. Retry on next scheduled cycle.                                     | No immediate retry. Next cycle (15 min). |
| HTTP 429 (rate limit)     | Log warning. Back off. Retry next cycle.                                        | No immediate retry.                      |
| HTTP 5xx (platform error) | Log warning. Retry up to 3 times with exponential backoff (5s, 15s, 45s).       | Yes, within same cycle.                  |
| HTTP 401 (auth expired)   | Attempt token refresh. If refresh fails, log error and surface Dashboard alert. | Yes, once after token refresh.           |

### 6.4.2 Data Errors

| **Error Type**                             | **Handling**                                                                                             |
|--------------------------------------------|----------------------------------------------------------------------------------------------------------|
| Duplicate order (external_order_id exists) | Skip silently. Not an error.                                                                             |
| Unmatched SKU                              | Import the order. Flag the line as unmatched. Surface on Dashboard.                                      |
| Invalid or missing order fields            | Import the order with available data. Log the specific field error. Do not reject the entire order.      |
| Malformed API response                     | Log the raw response body for debugging. Skip the malformed order. Continue processing remaining orders. |

### 6.4.3 Sync State Recovery

If the sync process crashes mid-cycle (e.g., application restart), no orders are lost. The last_sync_timestamp is only updated after a successful cycle completes. On restart, the next cycle re-fetches orders from the last successful timestamp, and the deduplication check (external_order_id) prevents double imports. This makes the sync process idempotent and crash-safe.

# 7. Deployment Strategy

## 7.1 Local Development Setup

### 7.1.1 Prerequisites

- Node.js 20 LTS

- Docker and Docker Compose (for PostgreSQL only)

- Git

### 7.1.2 Getting Started

1.  Clone the repository.

2.  Copy .env.example to .env. Fill in eBay and WooCommerce credentials (or leave blank to disable sync).

3.  Run docker compose up -d db to start PostgreSQL in a container.

4.  Run npm install in both /api and /web directories.

5.  Run npm run migrate in /api to apply database migrations (Knex migrations).

6.  Run npm run seed in /api to create the default admin user and sample data.

7.  Run npm run dev in /api to start the Express server with hot reload (nodemon).

8.  Run npm run dev in /web to start the Vite dev server with HMR.

9.  Open http://localhost:5173. The Vite dev server proxies /api requests to the Express server on port 3000.

### 7.1.3 Local Architecture

> [Browser] --> [Vite Dev Server :5173] --> [Express API :3000] --> [PostgreSQL :5432]

## 7.2 Production Deployment

### 7.2.1 Server Specification

| **Resource**  | **Minimum**      | **Recommended**  |
|---------------|------------------|------------------|
| vCPUs         | 2                | 4                |
| RAM           | 4 GB             | 8 GB             |
| Storage       | 40 GB SSD        | 80 GB SSD        |
| OS            | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| Cost estimate | \$12–20/month    | \$24–40/month    |

### 7.2.2 Docker Compose Production File

Production uses a docker-compose.prod.yml with three services:

- nginx: Serves the built React SPA from a static volume. Handles TLS via Let’s Encrypt (certbot sidecar or manual cert). Reverse proxies /api to the Node.js container.

- api: The Node.js Express application, built as a production Docker image (multi-stage build: install deps, compile TypeScript, copy dist). Runs with NODE_ENV=production. Restarts automatically on crash.

- db: PostgreSQL with a named Docker volume for persistent data. Configuration tuned for the server’s RAM (shared_buffers, work_mem).

### 7.2.3 Deployment Procedure

1.  SSH into the production server.

2.  Pull the latest code from the repository (git pull).

3.  Build the production Docker images: docker compose -f docker-compose.prod.yml build.

4.  Run database migrations: docker compose -f docker-compose.prod.yml run --rm api npm run migrate.

5.  Restart the stack: docker compose -f docker-compose.prod.yml up -d.

6.  Verify the application is healthy: curl https://yourdomain.com/api/health.

Total deployment time: under 5 minutes. Zero downtime is not required for a single-company internal tool; a 10–30 second restart during off-peak hours is acceptable.

### 7.2.4 Health Check Endpoint

GET /api/health returns HTTP 200 with a JSON body: { status: ok, db: connected, uptime: 3600 }. The health check verifies database connectivity by running SELECT 1. Docker Compose uses this endpoint for container health monitoring and automatic restart on failure.

## 7.3 Database Migrations

Knex.js manages database schema changes through versioned migration files. Each migration has an up() and down() function. Migrations run in order and are tracked in a knex_migrations table in the database. Key practices:

- All schema changes go through migrations. No manual SQL against production.

- Migrations are committed to the repository alongside application code.

- Migrations run before the application starts (as part of the deployment procedure, Step 4).

- Rollbacks (down migrations) are available but used only in development. Production rollbacks are handled by deploying a new forward-migration that reverses the change.

## 7.4 Backup Strategy

### 7.4.1 Automated Backups

1.  A cron job runs daily at 02:00 UTC (outside business hours).

2.  The job executes: docker exec db pg_dump -Fc -U postgres inventory > backup\_\$(date +%Y%m%d).dump.

3.  The dump file is compressed and uploaded to off-site storage (e.g., S3-compatible bucket, Backblaze B2, or a second VPS).

4.  Backups older than 30 days are automatically deleted from off-site storage.

5.  A weekly test restore runs against a throwaway database container to verify backup integrity.

### 7.4.2 Restore Procedure

1.  Provision a clean PostgreSQL instance (or stop the existing container and delete the volume).

2.  Download the backup file from off-site storage.

3.  Run: pg_restore -d inventory backup_YYYYMMDD.dump.

4.  Run any migrations that post-date the backup.

5.  Start the application.

Estimated RTO (Recovery Time Objective): under 30 minutes. RPO (Recovery Point Objective): 24 hours (daily backups).

## 7.5 Monitoring

For MVP, monitoring is intentionally minimal. The system is a single-company internal tool, not a public SaaS product.

- Application logging: Structured JSON logs (using pino) written to stdout. Docker captures and rotates. Log levels: error (always), warn (always), info (production default), debug (development only).

- Health check: The /api/health endpoint is monitored by an external uptime checker (e.g., UptimeRobot free tier or a simple cron curl from another machine). Alert via email or SMS if the endpoint fails for 5 consecutive minutes.

- Database monitoring: PostgreSQL’s built-in pg_stat_statements extension tracks slow queries. Reviewed manually during optimization cycles, not in real-time.

- Disk space: A cron job checks disk usage daily and alerts if usage exceeds 80%.

## 7.6 MVP Scope and Phased Delivery

The system is deployed in two phases to deliver value quickly and reduce risk.

### 7.6.1 Phase 1: Core Operations (MVP)

Deliver the minimum system that replaces the current manual process and solves the inventory accuracy problem.

- Products module (full)

- Purchase Orders module with receiving workflow

- Orders module with manual order entry and standard shipment confirmation

- Inventory Actions: manual outbound and inventory adjustments

- Dashboard: summary panel and alerts

- Authentication and user management

Phase 1 does not include: integration sync, Scan-to-Ship, Batch Ship, Next Order Flow, cycle counts, or transfers. These are deferred to Phase 2.

### 7.6.2 Phase 2: Speed and Integration

Add the high-speed workflows and platform integrations that scale the system for volume.

- eBay and WooCommerce sync with SKU mapping

- Scan-to-Ship workflow

- Batch Ship and Next Order Flow

- Today’s Work view

- Cycle counts and transfers

- Keyboard shortcuts

Phase 1 is estimated at 4–6 weeks of development. Phase 2 is estimated at 3–4 weeks. The system is usable and solves the core problem after Phase 1.

# 8. Security

Security measures are proportional to the threat model: a single-company internal tool accessed over the internet by trusted users.

## 8.1 Transport

- All traffic encrypted via TLS 1.2+ (HTTPS). Nginx handles certificate management via Let’s Encrypt with auto-renewal.

- HTTP requests are redirected to HTTPS. HSTS header is set.

## 8.2 Authentication

- Passwords hashed with bcrypt (cost factor 12). Plaintext passwords are never stored or logged.

- Session cookies are httpOnly (no JavaScript access), secure (HTTPS only), and sameSite=strict (CSRF protection).

- Failed login attempts are rate-limited: 5 attempts per 15-minute window per IP address.

## 8.3 Input Validation

- All API inputs are validated server-side using a schema validation library (Zod). Invalid requests receive HTTP 400 with specific field errors.

- Database queries use parameterized statements (Knex’s built-in parameterization). No string concatenation in SQL.

- User-supplied strings are sanitized for display. React’s default JSX escaping prevents XSS in the frontend.

## 8.4 Environment Variables

- Database credentials, API keys (eBay, WooCommerce), and session secrets are stored in environment variables, never in code or version control.

- A .env.example file with placeholder values is committed. The actual .env file is .gitignored.

## 8.5 Network

- The PostgreSQL container is not exposed to the public internet. It binds only to the Docker internal network.

- SSH access to the server uses key-based authentication (password auth disabled).

- Optional: restrict API access to a VPN or IP whitelist if the business operates from fixed locations.

# 9. Decision Log

Summary of all significant architectural decisions, the alternatives considered, and the rationale for each choice.

| **Decision**            | **Choice**                                        | **Key Rationale**                                                                  |
|-------------------------|---------------------------------------------------|------------------------------------------------------------------------------------|
| Backend runtime         | Node.js + Express + TypeScript                    | Single language; mature; sufficient for low-concurrency CRUD                       |
| Frontend framework      | React + Vite + Tailwind                           | SPA speed for warehouse workflows; largest talent pool                             |
| Database                | PostgreSQL (single instance)                      | Full SQL feature set; handles all schema requirements; no scaling complexity       |
| Query layer             | Knex.js (query builder)                           | Precise SQL control; no ORM abstraction tax; schema already designed               |
| Server state management | TanStack Query                                    | Automatic caching and invalidation replaces manual state management                |
| Client state management | Zustand                                           | Minimal API for Scan-to-Ship session state; no Redux overhead                      |
| Hosting                 | Single VPS + Docker Compose                       | Cheapest, simplest deployment; sufficient for single-tenant use                    |
| Authentication          | Session-based (PostgreSQL-backed)                 | Simplest approach for trusted single-role users; no JWT refresh logic              |
| Integration sync        | Polling (15 min interval)                         | No public endpoint needed; crash-safe; acceptable latency for order import         |
| Real-time updates       | TanStack Query cache invalidation                 | No WebSocket infrastructure; sufficient for 1–5 concurrent users                   |
| Concurrency control     | Optimistic locking on products.updated_at         | Lock-free reads; rare conflicts at this concurrency level; retry handles conflicts |
| Phased delivery         | MVP without integrations, then add speed features | Delivers core value (inventory accuracy) in 4–6 weeks                              |
