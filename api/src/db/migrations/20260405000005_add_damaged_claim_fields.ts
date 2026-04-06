import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('manual_outbound', (t) => {
    t.string('claim_status', 20).notNullable().defaultTo('open');
    t.decimal('credit_amount', 12, 4).nullable();
    t.timestamp('credited_at', { useTz: true }).nullable();
    t.string('credited_by', 100).nullable();
    t.string('manufacturer_reference', 100).nullable();
    t.text('claim_notes').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('manual_outbound', (t) => {
    t.dropColumn('claim_status');
    t.dropColumn('credit_amount');
    t.dropColumn('credited_at');
    t.dropColumn('credited_by');
    t.dropColumn('manufacturer_reference');
    t.dropColumn('claim_notes');
  });
}
