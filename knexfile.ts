import type { Knex } from 'knex';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'second_brain',
      user: process.env.POSTGRES_USER || 'second_brain_user',
      password: process.env.POSTGRES_PASSWORD || 'second_brain_password',
    },
    migrations: {
      directory: './src/migrations',
      extension: 'ts',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './src/seeds',
      extension: 'ts'
    },
    pool: {
      min: 2,
      max: 10
    }
  },

  production: {
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
      directory: './dist/migrations',
      extension: 'js',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './dist/seeds',
      extension: 'js'
    },
    pool: {
      min: 2,
      max: 10
    }
  }
};

export default config;