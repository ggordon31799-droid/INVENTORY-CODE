# Inventory Management System

Custom inventory management system for cardboard shipping box warehouse operations.

## Architecture

- **Backend:** Node.js + Express + TypeScript + Knex + PostgreSQL
- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Database:** PostgreSQL 16+

See `/docs` for full specifications:
- `docs/prd.md` — Product Requirements Document
- `docs/database_schema.md` — Database Schema Design
- `docs/architecture.md` — Technical Architecture Document

## Project Structure

```
/api          Backend API server
  /src
    /routes         Express route definitions
    /controllers    Request handlers
    /services       Business logic (inventoryService.applyDelta is the single entry point for all inventory changes)
    /db             Database connection and Knex config
    /middleware      Express middleware
    /types          Shared TypeScript types
    /utils          Shared utilities

/web          Frontend application
  /src
    /pages          Top-level page components
    /components     Reusable UI components
    /services       API client and service layer
    /hooks          Custom React hooks
    /types          Shared TypeScript types
    /utils          Shared utilities

/docs         Project documentation (do not modify without approval)
```

## Prerequisites

- Node.js 20 LTS
- PostgreSQL 16+

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd INVENTORY-CODE

# Install backend dependencies
cd api
cp .env.example .env
npm install

# Install frontend dependencies
cd ../web
cp .env.example .env
npm install
```

### 2. Set up the database

```bash
createdb inventory
```

Edit `api/.env` with your PostgreSQL connection string if it differs from the default:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/inventory
```

### 3. Run locally

```bash
# Terminal 1 — Backend (runs on port 3000)
cd api
npm run dev

# Terminal 2 — Frontend (runs on port 5173, proxies /api to backend)
cd web
npm run dev
```

### 4. Verify

- Backend health check: http://localhost:3000/health
- Frontend: http://localhost:5173

## Design Constraints

- Single user role: Admin. No permissions or role-based access.
- No accounting, invoicing, or advanced reporting.
- No reservation, allocation, or hold system.
- Single-location tracking per SKU. No multi-bin.
- All inventory quantity changes go through `inventoryService.applyDelta()`.
- Barcode scanning supported but never required.
