import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // --- purchase_orders ---
  await knex.schema.createTable('purchase_orders', (t) => {
    t.bigIncrements('id').primary();
    t.string('po_number', 50).notNullable().unique();
    t.string('supplier', 255).notNullable();
    t.string('status', 30).notNullable().defaultTo('open');
    t.date('expected_date').nullable();
    t.text('notes').nullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('status');
    t.index('expected_date');
  });

  // --- po_line_items ---
  await knex.schema.createTable('po_line_items', (t) => {
    t.bigIncrements('id').primary();
    t.bigInteger('purchase_order_id').notNullable()
      .references('id').inTable('purchase_orders');
    t.bigInteger('product_id').notNullable()
      .references('id').inTable('products');
    t.integer('ordered_qty').notNullable();
    t.decimal('unit_cost', 12, 4).notNullable();
    t.integer('received_qty').notNullable().defaultTo(0);
    t.string('line_status', 20).notNullable().defaultTo('open');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('purchase_order_id');
  });

  // --- receipts ---
  await knex.schema.createTable('receipts', (t) => {
    t.bigIncrements('id').primary();
    t.bigInteger('purchase_order_id').notNullable()
      .references('id').inTable('purchase_orders');
    t.string('bol_number', 100).nullable();
    t.string('received_by', 100).notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    // No updated_at — receipts are immutable
  });

  // --- receipt_line_items ---
  await knex.schema.createTable('receipt_line_items', (t) => {
    t.bigIncrements('id').primary();
    t.bigInteger('receipt_id').notNullable()
      .references('id').inTable('receipts');
    t.bigInteger('po_line_item_id').notNullable()
      .references('id').inTable('po_line_items');
    t.bigInteger('product_id').notNullable()
      .references('id').inTable('products');
    t.integer('received_qty').notNullable();
    t.decimal('unit_cost', 12, 4).notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    // No updated_at — receipt line items are immutable

    t.index('receipt_id');
    t.index('product_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('receipt_line_items');
  await knex.schema.dropTableIfExists('receipts');
  await knex.schema.dropTableIfExists('po_line_items');
  await knex.schema.dropTableIfExists('purchase_orders');
}
