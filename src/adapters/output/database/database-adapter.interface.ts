/**
 * DatabaseAdapter Interface
 * 
 * Defines the contract for database adapters.
 */
import { Knex } from 'knex';

export interface IDatabaseAdapter {
  /**
   * Get the database client
   */
  getKnex(): Knex;
  
  /**
   * Test the database connection
   */
  testConnection(): Promise<void>;
  
  /**
   * Run database migrations
   */
  runMigrations(): Promise<void>;
  
  /**
   * Close database connections
   */
  destroy(): Promise<void>;
  
  /**
   * Begin a transaction
   */
  beginTransaction(): Promise<Knex.Transaction>;
}