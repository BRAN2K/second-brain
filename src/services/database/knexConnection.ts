import knex, { Knex } from 'knex';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

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

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public getKnex(): Knex {
    return this.knexInstance;
  }

  public async testConnection(): Promise<void> {
    try {
      await this.knexInstance.raw('SELECT NOW()');
      console.log('✅ Conexão com PostgreSQL (Knex) estabelecida com sucesso');
    } catch (error) {
      console.error('❌ Erro ao conectar com PostgreSQL (Knex):', error);
      throw error;
    }
  }

  public async runMigrations(): Promise<void> {
    try {
      console.log('🔄 Executando migrations...');
      await this.knexInstance.migrate.latest();
      console.log('✅ Migrations executadas com sucesso');
    } catch (error) {
      console.error('❌ Erro ao executar migrations:', error);
      throw error;
    }
  }

  public async destroy(): Promise<void> {
    await this.knexInstance.destroy();
  }
}

export default DatabaseConnection;