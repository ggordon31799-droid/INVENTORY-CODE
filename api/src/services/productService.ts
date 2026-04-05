import db from '../db/connection';
import { NotFoundError } from '../utils/errors';

// CONSTRAINT: This service NEVER modifies products.qty_on_hand.
// Quantity changes are owned exclusively by inventoryService.applyDelta().

const TOTAL_VALUE_RAW = db.raw('(qty_on_hand * weighted_avg_cost) as total_value');

export async function listProducts(params: {
  search?: string;
  status?: string;
  category?: string;
  location?: string;
  page?: number;
  limit?: number;
}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const offset = (page - 1) * limit;

  const query = db('products');

  if (params.search) {
    const term = `%${params.search}%`;
    query.where(function () {
      this.whereILike('sku', term)
        .orWhereILike('product_name', term)
        .orWhereILike('barcode', term);
    });
  }

  if (params.status) {
    query.where('status', params.status);
  }
  if (params.category) {
    query.where('category', params.category);
  }
  if (params.location) {
    query.where('location', params.location);
  }

  const countQuery = query.clone().count('* as count').first();
  const dataQuery = query
    .clone()
    .select('*', TOTAL_VALUE_RAW)
    .orderBy('product_name', 'asc')
    .limit(limit)
    .offset(offset);

  const [countResult, data] = await Promise.all([countQuery, dataQuery]);
  const total = Number((countResult as any)?.count ?? 0);

  return { data, total, page, limit };
}

export async function getProduct(id: number) {
  const product = await db('products')
    .select('*', TOTAL_VALUE_RAW)
    .where('id', id)
    .first();

  if (!product) {
    throw new NotFoundError(`Product with id ${id} not found`);
  }

  return product;
}

export async function createProduct(data: {
  sku: string;
  product_name: string;
  barcode?: string;
  category?: string;
  reorder_threshold?: number;
  location?: string;
  notes?: string;
}) {
  const [product] = await db('products')
    .insert({
      sku: data.sku,
      product_name: data.product_name,
      barcode: data.barcode ?? null,
      category: data.category ?? null,
      reorder_threshold: data.reorder_threshold ?? 0,
      location: data.location ?? null,
      notes: data.notes ?? null,
      qty_on_hand: 0,
      weighted_avg_cost: 0,
      status: 'active',
    })
    .returning('*');

  return product;
}

export async function updateProduct(
  id: number,
  data: {
    product_name?: string;
    barcode?: string | null;
    category?: string | null;
    reorder_threshold?: number;
    location?: string | null;
    status?: string;
    notes?: string | null;
  }
) {
  // Allowlist: only these fields may be updated.
  // sku is immutable. qty_on_hand and weighted_avg_cost are owned by applyDelta/costService.
  const ALLOWED_FIELDS = [
    'product_name', 'barcode', 'category',
    'reorder_threshold', 'location', 'status', 'notes',
  ];

  const updatePayload: Record<string, any> = {};
  for (const key of ALLOWED_FIELDS) {
    if ((data as any)[key] !== undefined) {
      updatePayload[key] = (data as any)[key];
    }
  }

  if (Object.keys(updatePayload).length === 0) {
    return getProduct(id);
  }

  updatePayload.updated_at = db.fn.now();

  const [product] = await db('products')
    .where('id', id)
    .update(updatePayload)
    .returning('*');

  if (!product) {
    throw new NotFoundError(`Product with id ${id} not found`);
  }

  return product;
}

export async function lookupByBarcode(barcode: string) {
  const product = await db('products')
    .select('*', TOTAL_VALUE_RAW)
    .where('barcode', barcode)
    .first();

  return product ?? null;
}

export async function getCostHistory(
  productId: number,
  params: { page?: number; limit?: number }
) {
  // TODO: Implement when Purchase Orders module is built.
  // Must query: receipt_line_items JOIN receipts JOIN purchase_orders
  // WHERE receipt_line_items.product_id = productId
  // Return: unit_cost, received qty, PO number, supplier, receipt date
  // Source: docs/database_schema.md § 1.2, docs/prd.md § 7.3

  // Verify the product exists (404 if not)
  await getProduct(productId);

  const page = params.page ?? 1;
  const limit = params.limit ?? 50;

  return { data: [], total: 0, page, limit };
}

export async function getLedger(
  productId: number,
  params: { page?: number; limit?: number; event_type?: string }
) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const offset = (page - 1) * limit;

  const baseQuery = db('inventory_ledger').where('product_id', productId);

  if (params.event_type) {
    baseQuery.where('event_type', params.event_type);
  }

  const countQuery = baseQuery.clone().count('* as count').first();
  const dataQuery = baseQuery
    .clone()
    .select('*')
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);

  const [countResult, data] = await Promise.all([countQuery, dataQuery]);
  const total = Number((countResult as any)?.count ?? 0);

  return { data, total, page, limit };
}

// --- Integration mappings ---

export async function addMapping(
  productId: number,
  data: {
    platform: string;
    external_sku: string;
    external_name?: string;
  }
) {
  // Verify product exists
  await getProduct(productId);

  const [mapping] = await db('product_integration_mappings')
    .insert({
      product_id: productId,
      platform: data.platform,
      external_sku: data.external_sku,
      external_name: data.external_name ?? null,
    })
    .returning('*');

  return mapping;
}

export async function deleteMapping(productId: number, mappingId: number) {
  const deleted = await db('product_integration_mappings')
    .where({ id: mappingId, product_id: productId })
    .del();

  if (deleted === 0) {
    throw new NotFoundError(
      `Mapping with id ${mappingId} not found for product ${productId}`
    );
  }
}

export async function getMappings(productId: number) {
  return db('product_integration_mappings')
    .where('product_id', productId)
    .select('*');
}
