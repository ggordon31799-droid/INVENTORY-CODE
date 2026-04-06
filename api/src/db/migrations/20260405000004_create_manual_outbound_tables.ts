import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // --- manual_outbound ---
  await knex.schema.createTable('manual_outbound', (t) => {
    t.bigIncrements('id').primary();
    t.string('outbound_type', 30).notNullable();
    t.string('reason_text', 255).nullable();
    t.string('reference_number', 100).nullable();
    t.string('created_by', 100).notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    // No updated_at — manual outbound records are immutable
  });

  // --- manual_outbound_line_items ---
  await knex.schema.createTable('manual_outbound_line_items', (t) => {
    t.bigIncrements('id').primary();
    t.bigInteger('manual_outbound_id').notNullable()
      .references('id').inTable('manual_outbound');
    t.bigInteger('product_id').notNullable()
      .references('id').inTable('products');
    t.integer('qty').notNullable();
    t.decimal('unit_cost_snapshot', 12, 4).nullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('product_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('manual_outbound_line_items');
  await knex.schema.dropTableIfExists('manual_outbound');
}
