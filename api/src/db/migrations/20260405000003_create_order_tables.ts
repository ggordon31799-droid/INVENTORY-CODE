import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // --- orders ---
  await knex.schema.createTable('orders', (t) => {
    t.bigIncrements('id').primary();
    t.string('order_number', 50).notNullable().unique();
    t.string('external_order_id', 100).nullable();
    t.string('source', 20).notNullable();
    t.string('status', 30).notNullable().defaultTo('pending');
    t.string('customer_name', 255).nullable();
    t.timestamp('order_date', { useTz: true }).nullable();
    t.timestamp('import_date', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('ship_date', { useTz: true }).nullable();
    t.text('notes').nullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('status');
    t.index('order_date');
    t.index(['status', 'order_date']);
  });

  // Partial unique index: (source, external_order_id) WHERE external_order_id IS NOT NULL
  await knex.raw(`
    CREATE UNIQUE INDEX orders_source_external_order_id_unique
    ON orders (source, external_order_id)
    WHERE external_order_id IS NOT NULL
  `);

  // --- order_line_items ---
  await knex.schema.createTable('order_line_items', (t) => {
    t.bigIncrements('id').primary();
    t.bigInteger('order_id').notNullable()
      .references('id').inTable('orders');
    t.bigInteger('product_id').nullable()
      .references('id').inTable('products');
    t.string('external_sku', 255).nullable();
    t.string('product_name_external', 255).nullable();
    t.integer('ordered_qty').notNullable();
    t.integer('shipped_qty').notNullable().defaultTo(0);
    t.string('line_status', 20).notNullable().defaultTo('pending');
    t.boolean('is_matched').notNullable().defaultTo(true);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('order_id');
    t.index('product_id');
  });

  // Partial index for unmatched SKU alerts
  await knex.raw(`
    CREATE INDEX order_line_items_unmatched
    ON order_line_items (is_matched)
    WHERE is_matched = false
  `);

  // --- shipments ---
  await knex.schema.createTable('shipments', (t) => {
    t.bigIncrements('id').primary();
    t.bigInteger('order_id').notNullable()
      .references('id').inTable('orders');
    t.string('tracking_number', 255).nullable();
    t.string('batch_id', 50).nullable();
    t.string('shipped_by', 100).notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    // No updated_at — shipments are immutable
  });

  // --- shipment_line_items ---
  await knex.schema.createTable('shipment_line_items', (t) => {
    t.bigIncrements('id').primary();
    t.bigInteger('shipment_id').notNullable()
      .references('id').inTable('shipments');
    t.bigInteger('order_line_item_id').notNullable()
      .references('id').inTable('order_line_items');
    t.bigInteger('product_id').notNullable()
      .references('id').inTable('products');
    t.integer('shipped_qty').notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('shipment_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('shipment_line_items');
  await knex.schema.dropTableIfExists('shipments');
  await knex.raw('DROP INDEX IF EXISTS order_line_items_unmatched');
  await knex.schema.dropTableIfExists('order_line_items');
  await knex.raw('DROP INDEX IF EXISTS orders_source_external_order_id_unique');
  await knex.schema.dropTableIfExists('orders');
}
