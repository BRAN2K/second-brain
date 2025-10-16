/**
 * Knex database connection manager
 */
import knex, { Knex } from 'knex';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Singleton class for managing database connections using Knex
 */
class DatabaseConnection {
  private static instance: DatabaseConnection;
  private knexInstance: Knex;

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
        directory: environment === 'production' ? './dist/migrations' : './src/migrations',
        extension: environment === 'production' ? 'js' : 'ts',
        tableName: 'knex_migrations'
      },
      pool: {
        min: 2,
        max: 10
      }
    };
    
    this.knexInstance = knex(config);
  }

  /**
   * Get the singleton instance of the database connection
   */
  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  /**
   * Get the Knex instance for database operations
   */
  public getKnex(): Knex {
    return this.knexInstance;
  }

  /**
   * Test the database connection
   */
  public async testConnection(): Promise<void> {
    try {
      await this.knexInstance.raw('SELECT NOW()');
      console.log('✅ Database connection established successfully');
    } catch (error) {
      console.error('❌ Error connecting to database:', error);
      throw error;
    }
  }

  /**
   * Run database migrations
   */
  public async runMigrations(): Promise<void> {
    try {
      console.log('🔄 Running migrations...');
      await this.knexInstance.migrate.latest();
      console.log('✅ Migrations completed successfully');
    } catch (error) {
      console.error('❌ Error running migrations:', error);
      throw error;
    }
  }

  /**
   * Close database connections
   */
  public async destroy(): Promise<void> {
    await this.knexInstance.destroy();
  }
}

export default DatabaseConnection;