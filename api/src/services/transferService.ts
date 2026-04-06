import db from '../db/connection';
import { NotFoundError } from '../utils/errors';

/**
 * Transfer Service
 *
 * Transfers change product location only. No quantity change.
 * No inventory_ledger entry — the transfers table is the audit trail.
 */

export async function confirmTransfer(data: {
  product_id: number;
  to_location: string;
  transferred_by: string;
}) {
  if (!data.to_location?.trim()) {
    throw new Error('to_location is required');
  }
  if (!data.transferred_by) {
    throw new Error('transferred_by is required');
  }

  const product = await db('products')
    .where('id', data.product_id)
    .select('id', 'location')
    .first();

  if (!product) {
    throw new NotFoundError(`Product with id ${data.product_id} not found`);
  }

  const fromLocation = product.location;

  // Create transfer record
  const [transfer] = await db('transfers')
    .insert({
      product_id: data.product_id,
      from_location: fromLocation,
      to_location: data.to_location.trim(),
      transferred_by: data.transferred_by,
    })
    .returning('*');

  // Update product location
  await db('products')
    .where('id', data.product_id)
    .update({
      location: data.to_location.trim(),
      updated_at: db.fn.now(),
    });

  return transfer;
}

export async function listTransfers(params: {
  product_id?: number;
  page?: number;
  limit?: number;
}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const offset = (page - 1) * limit;

  const query = db('transfers')
    .join('products', 'transfers.product_id', 'products.id');

  if (params.product_id) {
    query.where('transfers.product_id', params.product_id);
  }

  const countQuery = query.clone().count('* as count').first();
  const dataQuery = query
    .clone()
    .select(
      'transfers.*',
      'products.sku',
      'products.product_name'
    )
    .orderBy('transfers.created_at', 'desc')
    .limit(limit)
    .offset(offset);

  const [countResult, data] = await Promise.all([countQuery, dataQuery]);
  const total = Number((countResult as any)?.count ?? 0);

  return { data, total, page, limit };
}
