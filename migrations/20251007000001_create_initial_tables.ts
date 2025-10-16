import { Knex } from 'knex';

/**
 * Run the migrations.
 * This contains the same schema as init-db.sql but in Knex migration format
 */
export async function up(knex: Knex): Promise<void> {
  // Create tables
  if (!(await knex.schema.hasTable('transcription_logs'))) {
    await knex.schema.createTable('transcription_logs', (table) => {
      table.increments('id').primary();
      table.integer('user_id').notNullable();
      table.string('username', 255);
      table.text('text').notNullable();
      table.float('audio_duration');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.text('metadata');
    });

    await knex.raw(`
      CREATE INDEX IF NOT EXISTS idx_transcription_logs_user_id ON transcription_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_transcription_logs_created_at ON transcription_logs(created_at);
    `);
  }

  if (!(await knex.schema.hasTable('financial_transactions'))) {
    await knex.schema.createTable('financial_transactions', (table) => {
      table.increments('id').primary();
      table.integer('user_id').notNullable();
      table.decimal('amount', 15, 2).notNullable();
      table.string('type', 20).notNullable().checkIn(['income', 'expense', 'transfer']);
      table.string('category', 100).notNullable();
      table.text('description').notNullable();
      table.date('date').notNullable();
      table.string('account', 100);
      table.specificType('tags', 'TEXT[]');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.text('metadata');
    });

    await knex.raw(`
      CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_id ON financial_transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(date);
      CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(type);
      CREATE INDEX IF NOT EXISTS idx_financial_transactions_category ON financial_transactions(category);
    `);
  }

  if (!(await knex.schema.hasTable('financial_accounts'))) {
    await knex.schema.createTable('financial_accounts', (table) => {
      table.increments('id').primary();
      table.integer('user_id').notNullable();
      table.string('name', 100).notNullable();
      table.string('type', 20).notNullable().checkIn(['checking', 'savings', 'credit', 'investment', 'cash']);
      table.string('bank', 100);
      table.decimal('balance', 15, 2);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });

    await knex.raw(`
      CREATE INDEX IF NOT EXISTS idx_financial_accounts_user_id ON financial_accounts(user_id);
      CREATE INDEX IF NOT EXISTS idx_financial_accounts_type ON financial_accounts(type);
    `);
  }

  if (!(await knex.schema.hasTable('financial_goals'))) {
    await knex.schema.createTable('financial_goals', (table) => {
      table.increments('id').primary();
      table.integer('user_id').notNullable();
      table.string('title', 200).notNullable();
      table.text('description');
      table.decimal('target_amount', 15, 2).notNullable();
      table.decimal('current_amount', 15, 2).notNullable().defaultTo(0);
      table.date('target_date');
      table.string('category', 100).notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });

    await knex.raw(`
      CREATE INDEX IF NOT EXISTS idx_financial_goals_user_id ON financial_goals(user_id);
      CREATE INDEX IF NOT EXISTS idx_financial_goals_target_date ON financial_goals(target_date);
      CREATE INDEX IF NOT EXISTS idx_financial_goals_category ON financial_goals(category);
    `);
  }

  if (!(await knex.schema.hasTable('finance_extraction_logs'))) {
    await knex.schema.createTable('finance_extraction_logs', (table) => {
      table.increments('id').primary();
      table.integer('user_id').notNullable();
      table.text('transcription_text').notNullable();
      table.jsonb('extracted_data').notNullable();
      table.decimal('confidence', 3, 2).notNullable().checkBetween([0, 1]);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });

    await knex.raw(`
      CREATE INDEX IF NOT EXISTS idx_finance_extraction_logs_user_id ON finance_extraction_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_finance_extraction_logs_created_at ON finance_extraction_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_finance_extraction_logs_confidence ON finance_extraction_logs(confidence);
    `);
  }

  // Create the function for updating timestamps
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  // Create triggers
  await knex.raw(`
    DROP TRIGGER IF EXISTS update_financial_transactions_updated_at ON financial_transactions;
    CREATE TRIGGER update_financial_transactions_updated_at 
      BEFORE UPDATE ON financial_transactions 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
    DROP TRIGGER IF EXISTS update_financial_accounts_updated_at ON financial_accounts;
    CREATE TRIGGER update_financial_accounts_updated_at 
      BEFORE UPDATE ON financial_accounts 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
    DROP TRIGGER IF EXISTS update_financial_goals_updated_at ON financial_goals;
    CREATE TRIGGER update_financial_goals_updated_at 
      BEFORE UPDATE ON financial_goals 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);
}

/**
 * Rollback the migrations.
 */
export async function down(knex: Knex): Promise<void> {
  // Drop triggers first
  await knex.raw(`
    DROP TRIGGER IF EXISTS update_financial_transactions_updated_at ON financial_transactions;
    DROP TRIGGER IF EXISTS update_financial_accounts_updated_at ON financial_accounts;
    DROP TRIGGER IF EXISTS update_financial_goals_updated_at ON financial_goals;
  `);
  
  // Drop the function
  await knex.raw(`DROP FUNCTION IF EXISTS update_updated_at_column()`);
  
  // Drop tables
  await knex.schema.dropTableIfExists('finance_extraction_logs');
  await knex.schema.dropTableIfExists('financial_goals');
  await knex.schema.dropTableIfExists('financial_accounts');
  await knex.schema.dropTableIfExists('financial_transactions');
  await knex.schema.dropTableIfExists('transcription_logs');
}