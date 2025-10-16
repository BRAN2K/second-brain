/**
 * PostgreSQL Database Adapter
 * 
 * Implements the IDatabaseAdapter interface for PostgreSQL.
 * This is the recommended database adapter to use in the application.
 */
import knex, { Knex } from 'knex';
import * as dotenv from 'dotenv';
import { ILoggerPort } from '../../../domain/common/ports/logger.port';
import { IDatabaseAdapter } from './database-adapter.interface';

// Load environment variables
dotenv.config();

export class PostgresAdapter implements IDatabaseAdapter {
  private knexInstance: Knex;
  private logger?: ILoggerPort;
  
  constructor(logger?: ILoggerPort) {
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
    
    this.knexInstance = knex(config);
    this.logger = logger;
  }
  
  /**
   * Get the Knex instance
   */
  getKnex(): Knex {
    return this.knexInstance;
  }
  
  /**
   * Test the database connection
   */
  async testConnection(): Promise<void> {
    try {
      await this.knexInstance.raw('SELECT NOW()');
      this.logger?.info('Database connection established successfully');
    } catch (error) {
      this.logger?.error('Error connecting to database', error);
      throw error;
    }
  }
  
  /**
   * Run database migrations
   */
  async runMigrations(): Promise<void> {
    try {
      this.logger?.info('Running migrations...');
      await this.knexInstance.migrate.latest();
      this.logger?.info('Migrations completed successfully');
    } catch (error) {
      this.logger?.error('Error running migrations', error);
      throw error;
    }
  }
  
  /**
   * Close database connections
   */
  async destroy(): Promise<void> {
    try {
      await this.knexInstance.destroy();
      this.logger?.info('Database connection closed');
    } catch (error) {
      this.logger?.error('Error closing database connection', error);
      throw error;
    }
  }
  
  /**
   * Begin a transaction
   */
  async beginTransaction(): Promise<Knex.Transaction> {
    return await this.knexInstance.transaction();
  }
}