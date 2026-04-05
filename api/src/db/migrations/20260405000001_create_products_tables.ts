import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // --- products ---
  await knex.schema.createTable('products', (t) => {
    t.bigIncrements('id').primary();
    t.string('sku', 50).notNullable().unique();
    t.string('product_name', 255).notNullable();
    t.string('barcode', 100).nullable().unique();
    t.string('category', 100).nullable();
    t.integer('qty_on_hand').notNullable().defaultTo(0);
    t.integer('reorder_threshold').notNullable().defaultTo(0);
    t.string('location', 100).nullable();
    t.decimal('weighted_avg_cost', 12, 4).notNullable().defaultTo(0);
    t.string('status', 20).notNullable().defaultTo('active');
    t.text('notes').nullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('status');
    t.index('category');
    t.index('location');
  });

  // --- product_integration_mappings ---
  await knex.schema.createTable('product_integration_mappings', (t) => {
    t.bigIncrements('id').primary();
    t.bigInteger('product_id').notNullable().references('id').inTable('products');
    t.string('platform', 20).notNullable();
    t.string('external_sku', 255).notNullable();
    t.string('external_name', 255).nullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.unique(['platform', 'external_sku']);
    t.index('product_id');
  });

  // --- inventory_ledger ---
  await knex.schema.createTable('inventory_ledger', (t) => {
    t.bigIncrements('id').primary();
    t.bigInteger('product_id').notNullable().references('id').inTable('products');
    t.integer('qty_delta').notNullable();
    t.integer('qty_after').notNullable();
    t.string('event_type', 30).notNullable();
    t.string('source_table', 50).notNullable();
    t.bigInteger('source_id').notNullable();
    t.string('reference_code', 100).nullable();
    t.string('performed_by', 100).notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('product_id');
    t.index('created_at');
    t.index(['product_id', 'created_at']);
    t.index('event_type');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('inventory_ledger');
  await knex.schema.dropTableIfExists('product_integration_mappings');
  await knex.schema.dropTableIfExists('products');
}
