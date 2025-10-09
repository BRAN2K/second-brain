import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Criar extensões úteis
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pg_trgm"');

  // Tabela de logs de transcrição
  await knex.schema.createTable('transcription_logs', (table) => {
    table.increments('id').primary();
    table.string('user_id').notNullable();
    table.string('username', 255);
    table.text('text').notNullable();
    table.float('audio_duration');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.text('metadata');
    
    // Índices
    table.index('user_id', 'idx_transcription_logs_user_id');
    table.index('created_at', 'idx_transcription_logs_created_at');
  });

  // Tabela de logs de extração financeira
  await knex.schema.createTable('finance_extraction_logs', (table) => {
    table.increments('id').primary();
    table.string('user_id').notNullable();
    table.text('transcription_text').notNullable();
    table.jsonb('extracted_data').notNullable();
    table.float('confidence');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Índices
    table.index('user_id', 'idx_finance_extraction_logs_user_id');
  });

  // Tabela de transações financeiras
  await knex.schema.createTable('financial_transactions', (table) => {
    table.increments('id').primary();
    table.string('user_id').notNullable();
    table.decimal('amount', 15, 2).notNullable();
    table.enum('type', ['income', 'expense', 'transfer']).notNullable();
    table.string('category', 100).notNullable();
    table.text('description').notNullable();
    table.date('date').notNullable();
    table.string('account', 100);
    table.specificType('tags', 'TEXT[]'); // Array de strings
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.text('metadata'); // JSON string
    
    // Índices
    table.index('user_id', 'idx_financial_transactions_user_id');
    table.index('date', 'idx_financial_transactions_date');
    table.index('type', 'idx_financial_transactions_type');
    table.index('category', 'idx_financial_transactions_category');
  });

  // Tabela de contas financeiras
  await knex.schema.createTable('financial_accounts', (table) => {
    table.increments('id').primary();
    table.string('user_id').notNullable();
    table.string('name', 100).notNullable();
    table.enum('type', ['checking', 'savings', 'credit', 'investment', 'cash']).notNullable();
    table.string('bank', 100);
    table.decimal('balance', 15, 2);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.text('metadata');
    table.boolean('is_active').defaultTo(true);
    
    // Índices
    table.index('user_id', 'idx_financial_accounts_user_id');
    table.index('type', 'idx_financial_accounts_type');
    table.index('is_active', 'idx_financial_accounts_is_active');
  });

  // Tabela de metas financeiras
  await knex.schema.createTable('financial_goals', (table) => {
    table.increments('id').primary();
    table.string('user_id').notNullable();
    table.string('name', 200).notNullable();
    table.text('description');
    table.decimal('target_amount', 15, 2).notNullable();
    table.decimal('current_amount', 15, 2).defaultTo(0);
    table.date('target_date');
    table.enum('status', ['active', 'completed', 'paused', 'cancelled']).defaultTo('active');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.text('metadata');
    
    // Índices
    table.index('user_id', 'idx_financial_goals_user_id');
    table.index('status', 'idx_financial_goals_status');
    table.index('target_date', 'idx_financial_goals_target_date');
  });

  // Trigger para atualizar updated_at automaticamente
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  // Aplicar trigger nas tabelas que precisam
  await knex.raw(`
    CREATE TRIGGER update_financial_transactions_updated_at BEFORE UPDATE
    ON financial_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);

  await knex.raw(`
    CREATE TRIGGER update_financial_accounts_updated_at BEFORE UPDATE
    ON financial_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);

  await knex.raw(`
    CREATE TRIGGER update_financial_goals_updated_at BEFORE UPDATE
    ON financial_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Remover triggers
  await knex.raw('DROP TRIGGER IF EXISTS update_financial_goals_updated_at ON financial_goals');
  await knex.raw('DROP TRIGGER IF EXISTS update_financial_accounts_updated_at ON financial_accounts');
  await knex.raw('DROP TRIGGER IF EXISTS update_financial_transactions_updated_at ON financial_transactions');
  
  // Remover função
  await knex.raw('DROP FUNCTION IF EXISTS update_updated_at_column()');
  
  // Remover tabelas
  await knex.schema.dropTableIfExists('financial_goals');
  await knex.schema.dropTableIfExists('financial_accounts');
  await knex.schema.dropTableIfExists('financial_transactions');
  await knex.schema.dropTableIfExists('finance_extraction_logs');
  await knex.schema.dropTableIfExists('transcription_logs');
}