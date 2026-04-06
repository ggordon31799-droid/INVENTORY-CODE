import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // --- cycle_counts (must come before inventory_adjustments due to FK) ---
  await knex.schema.createTable('cycle_counts', (t) => {
    t.bigIncrements('id').primary();
    t.string('status', 20).notNullable().defaultTo('in_progress');
    t.string('scope_type', 30).nullable();
    t.string('scope_value', 255).nullable();
    t.integer('total_skus').notNullable().defaultTo(0);
    t.integer('discrepancy_count').notNullable().defaultTo(0);
    t.integer('adjustments_made').notNullable().defaultTo(0);
    t.string('counted_by', 100).notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('completed_at', { useTz: true }).nullable();
  });

  // --- inventory_adjustments ---
  await knex.schema.createTable('inventory_adjustments', (t) => {
    t.bigIncrements('id').primary();
    t.bigInteger('product_id').notNullable()
      .references('id').inTable('products');
    t.integer('previous_qty').notNullable();
    t.integer('new_qty').notNullable();
    t.integer('qty_delta').notNullable();
    t.string('reason', 30).notNullable();
    t.text('notes').nullable();
    t.bigInteger('cycle_count_id').nullable()
      .references('id').inTable('cycle_counts');
    t.string('adjusted_by', 100).notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    // No updated_at — immutable

    t.index('product_id');
    t.index('reason');
  });

  // --- cycle_count_lines ---
  await knex.schema.createTable('cycle_count_lines', (t) => {
    t.bigIncrements('id').primary();
    t.bigInteger('cycle_count_id').notNullable()
      .references('id').inTable('cycle_counts');
    t.bigInteger('product_id').notNullable()
      .references('id').inTable('products');
    t.integer('system_qty').notNullable();
    t.integer('counted_qty').nullable();
    t.integer('variance').nullable();
    t.boolean('accepted').notNullable().defaultTo(false);
    t.bigInteger('adjustment_id').nullable()
      .references('id').inTable('inventory_adjustments');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('cycle_count_id');
    t.index('product_id');
  });

  // --- transfers ---
  await knex.schema.createTable('transfers', (t) => {
    t.bigIncrements('id').primary();
    t.bigInteger('product_id').notNullable()
      .references('id').inTable('products');
    t.string('from_location', 100).nullable();
    t.string('to_location', 100).notNullable();
    t.string('transferred_by', 100).notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    // No updated_at — immutable, no ledger entry
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('transfers');
  await knex.schema.dropTableIfExists('cycle_count_lines');
  await knex.schema.dropTableIfExists('inventory_adjustments');
  await knex.schema.dropTableIfExists('cycle_counts');
}
