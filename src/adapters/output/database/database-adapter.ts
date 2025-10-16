/**
 * Database Adapter base class
 * 
 * This module provides a clean way to access the Knex instance from 
 * the infrastructure layer for use in repository adapters.
 * 
 * Implementation of the IDatabaseAdapter interface as a singleton.
 */
import knex, { Knex } from 'knex';
import * as dotenv from 'dotenv';
import { IDatabaseAdapter } from './database-adapter.interface';

// Load environment variables
dotenv.config();

/**
 * @deprecated Use PostgresAdapter instead
 */
export class DatabaseAdapter implements IDatabaseAdapter {
  private static _instance: DatabaseAdapter;
  private _knex: Knex;

  private constructor() {
    const environment = process.env.NODE_ENV || 'development';
    
    const config: Knex.Config = {
      client: 'postgresql',
      connection: {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.POSTGRES_DB || 'second_brain',
        user: process.env.POSTGRES_USER || 'second_brain_user',
        password: process.env.POSTGRES_PASSWORD || 'second_brain_password',
        ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false
      },
      migrations: {
        directory: '../../migrations',
        tableName: 'knex_migrations'
      },
      pool: {
        min: 2,
        max: 10
      }
    };
    
    this._knex = knex(config);
  }

  /**
   * Get the singleton instance of the DatabaseAdapter
   */
  public static getInstance(): DatabaseAdapter {
    if (!DatabaseAdapter._instance) {
      DatabaseAdapter._instance = new DatabaseAdapter();
    }
    return DatabaseAdapter._instance;
  }

  /**
   * Get the Knex instance for database operations
   */
  public getKnex(): Knex {
    return this._knex;
  }

  /**
   * Test the database connection
   */
  public async testConnection(): Promise<void> {
    try {
      await this._knex.raw('SELECT NOW()');
      console.log('✅ Database connection established successfully');
    } catch (error) {
      console.error('❌ Error connecting to database:', error);
      throw error;
    }
  }

  /**
   * Run migrations
   */
  public async runMigrations(): Promise<void> {
    try {
      console.log('🔄 Running migrations...');
      await this._knex.migrate.latest();
      console.log('✅ Migrations completed successfully');
    } catch (error) {
      console.error('❌ Error running migrations:', error);
      throw error;
    }
  }

  /**
   * Close the database connection
   */
  public async destroy(): Promise<void> {
    await this._knex.destroy();
    console.log('Database connection closed');
  }
  
  /**
   * Begin a transaction
   */
  public async beginTransaction(): Promise<Knex.Transaction> {
    return await this._knex.transaction();
  }
}