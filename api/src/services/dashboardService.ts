import db from '../db/connection';

/**
 * Dashboard Service
 *
 * Read-only queries against existing data. No inventory modifications.
 */

export async function getSummary() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [skuStats, receivedToday, shippedToday] = await Promise.all([
    // Total SKUs, units, value
    db('products')
      .where('status', 'active')
      .select(
        db.raw('COUNT(*) FILTER (WHERE qty_on_hand > 0) as total_skus'),
        db.raw('COALESCE(SUM(qty_on_hand), 0) as total_units'),
        db.raw('COALESCE(SUM(qty_on_hand * weighted_avg_cost), 0) as total_inventory_value')
      )
      .first(),

    // Units received today (from inventory_ledger)
    db('inventory_ledger')
      .where('event_type', 'receipt')
      .where('created_at', '>=', today.toISOString())
      .select(db.raw('COALESCE(SUM(qty_delta), 0) as units_received_today'))
      .first(),

    // Units shipped today (from inventory_ledger, negative deltas)
    db('inventory_ledger')
      .where('event_type', 'shipment')
      .where('created_at', '>=', today.toISOString())
      .select(db.raw('COALESCE(SUM(ABS(qty_delta)), 0) as units_shipped_today'))
      .first(),
  ]);

  return {
    total_skus: Number(skuStats?.total_skus ?? 0),
    total_units: Number(skuStats?.total_units ?? 0),
    total_inventory_value: parseFloat(skuStats?.total_inventory_value ?? '0'),
    units_received_today: Number(receivedToday?.units_received_today ?? 0),
    units_shipped_today: Number(shippedToday?.units_shipped_today ?? 0),
  };
}

export async function getAlerts() {
  const [lowStock, negativeInventory, unmatchedSkus, overduePOs, openDamagedClaims] =
    await Promise.all([
      // Low stock: qty_on_hand <= reorder_threshold AND reorder_threshold > 0
      db('products')
        .where('status', 'active')
        .where('reorder_threshold', '>', 0)
        .whereRaw('qty_on_hand <= reorder_threshold')
        .select('id', 'sku', 'product_name', 'qty_on_hand', 'reorder_threshold', 'location')
        .orderBy('qty_on_hand', 'asc')
        .limit(50),

      // Negative inventory
      db('products')
        .where('status', 'active')
        .where('qty_on_hand', '<', 0)
        .select('id', 'sku', 'product_name', 'qty_on_hand')
        .orderBy('qty_on_hand', 'asc'),

      // Unmatched SKUs on pending orders
      db('order_line_items')
        .join('orders', 'order_line_items.order_id', 'orders.id')
        .where('order_line_items.is_matched', false)
        .whereIn('orders.status', ['pending', 'partially_shipped'])
        .select(
          'order_line_items.id as line_id',
          'order_line_items.external_sku',
          'order_line_items.product_name_external',
          'orders.id as order_id',
          'orders.order_number',
          'orders.source'
        )
        .limit(50),

      // Overdue POs (expected_date < today, status open or partially_received)
      db('purchase_orders')
        .whereIn('status', ['open', 'partially_received'])
        .whereNotNull('expected_date')
        .where('expected_date', '<', db.fn.now())
        .select('id', 'po_number', 'supplier', 'expected_date', 'status')
        .orderBy('expected_date', 'asc'),

      // Open damaged claims
      db('manual_outbound')
        .where('outbound_type', 'damaged')
        .where('claim_status', '!=', 'closed')
        .select('id', 'claim_status', 'reference_number', 'created_at', 'created_by')
        .orderBy('created_at', 'asc')
        .limit(25),
    ]);

  return {
    low_stock: lowStock,
    negative_inventory: negativeInventory,
    unmatched_skus: unmatchedSkus,
    overdue_purchase_orders: overduePOs,
    open_damaged_claims: openDamagedClaims,
  };
}

export async function getActivity(params: { limit?: number }) {
  const limit = params.limit ?? 25;

  const entries = await db('inventory_ledger')
    .join('products', 'inventory_ledger.product_id', 'products.id')
    .select(
      'inventory_ledger.id',
      'inventory_ledger.product_id',
      'inventory_ledger.qty_delta',
      'inventory_ledger.qty_after',
      'inventory_ledger.event_type',
      'inventory_ledger.source_table',
      'inventory_ledger.source_id',
      'inventory_ledger.reference_code',
      'inventory_ledger.performed_by',
      'inventory_ledger.created_at',
      'products.sku',
      'products.product_name'
    )
    .orderBy('inventory_ledger.created_at', 'desc')
    .limit(limit);

  return entries;
}

export async function getTodaysWork() {
  const orders = await db('orders')
    .whereIn('status', ['pending', 'partially_shipped'])
    .orderBy('order_date', 'asc')
    .select('*');

  // Attach line items with stock info
  for (const order of orders) {
    order.line_items = await db('order_line_items')
      .leftJoin('products', 'order_line_items.product_id', 'products.id')
      .where('order_line_items.order_id', order.id)
      .select(
        'order_line_items.id',
        'order_line_items.product_id',
        'order_line_items.ordered_qty',
        'order_line_items.shipped_qty',
        'order_line_items.line_status',
        'order_line_items.is_matched',
        'products.sku',
        'products.product_name',
        'products.qty_on_hand'
      )
      .orderBy('order_line_items.id', 'asc');
  }

  return orders;
}
