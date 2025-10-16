/**
 * PostgresFinancialTransactionRepository
 * 
 * Implements the IFinancialTransactionRepository interface using PostgreSQL database.
 */
import { Knex } from 'knex';
import { FinancialTransaction } from '../../../domain/finance/entities';
import { IFinancialTransactionRepository } from '../../../domain/finance/repositories';
import { IDatabaseAdapter } from './database-adapter.interface';
import { PostgresAdapter } from './postgres-adapter';

export class PostgresFinancialTransactionRepository implements IFinancialTransactionRepository {
  private knex: Knex;
  private readonly tableName = 'financial_transactions';

  constructor(databaseAdapter?: IDatabaseAdapter) {
    if (databaseAdapter) {
      this.knex = databaseAdapter.getKnex();
    } else {
      const postgresAdapter = new PostgresAdapter();
      this.knex = postgresAdapter.getKnex();
    }
  }

  /**
   * Save a financial transaction to the database
   */
  async save(transaction: FinancialTransaction): Promise<FinancialTransaction> {
    try {
      const metadata = transaction.metadata ? 
        JSON.stringify(transaction.metadata) : null;
      
      const [result] = await this.knex(this.tableName)
        .insert({
          user_id: transaction.userId,
          amount: transaction.amount,
          type: transaction.type,
          category: transaction.category,
          description: transaction.description,
          date: transaction.date,
          account: transaction.account || null,
          tags: transaction.tags || null,
          created_at: transaction.createdAt,
          metadata
        })
        .returning('*');
      
      // Map DB record to domain entity
      return new FinancialTransaction(
        result.user_id,
        parseFloat(result.amount),
        result.type,
        result.category,
        result.description,
        new Date(result.date),
        result.account,
        result.tags,
        result.metadata ? JSON.parse(result.metadata) : undefined,
        new Date(result.created_at),
        result.updated_at ? new Date(result.updated_at) : undefined,
        result.id
      );
    } catch (error) {
      throw new Error(`Failed to save financial transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find a financial transaction by its ID
   */
  async findById(id: number): Promise<FinancialTransaction | null> {
    try {
      const result = await this.knex(this.tableName)
        .where('id', id)
        .first();
      
      if (!result) {
        return null;
      }
      
      // Map DB record to domain entity
      return new FinancialTransaction(
        result.user_id,
        parseFloat(result.amount),
        result.type,
        result.category,
        result.description,
        new Date(result.date),
        result.account,
        result.tags,
        result.metadata ? JSON.parse(result.metadata) : undefined,
        new Date(result.created_at),
        result.updated_at ? new Date(result.updated_at) : undefined,
        result.id
      );
    } catch (error) {
      throw new Error(`Failed to find financial transaction by ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find financial transactions by user ID
   */
  async findByUserId(userId: number, limit: number = 100): Promise<FinancialTransaction[]> {
    try {
      const results = await this.knex(this.tableName)
        .where('user_id', userId)
        .orderBy([
          { column: 'date', order: 'desc' },
          { column: 'created_at', order: 'desc' }
        ])
        .limit(limit);
      
      // Map DB records to domain entities
      return results.map(result => new FinancialTransaction(
        result.user_id,
        parseFloat(result.amount),
        result.type,
        result.category,
        result.description,
        new Date(result.date),
        result.account,
        result.tags,
        result.metadata ? JSON.parse(result.metadata) : undefined,
        new Date(result.created_at),
        result.updated_at ? new Date(result.updated_at) : undefined,
        result.id
      ));
    } catch (error) {
      throw new Error(`Failed to find financial transactions by user ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find financial transactions by user ID and type
   */
  async findByUserIdAndType(
    userId: number, 
    type: 'income' | 'expense' | 'transfer', 
    limit: number = 100
  ): Promise<FinancialTransaction[]> {
    try {
      const results = await this.knex(this.tableName)
        .where({
          user_id: userId,
          type
        })
        .orderBy([
          { column: 'date', order: 'desc' },
          { column: 'created_at', order: 'desc' }
        ])
        .limit(limit);
      
      // Map DB records to domain entities
      return results.map(result => new FinancialTransaction(
        result.user_id,
        parseFloat(result.amount),
        result.type,
        result.category,
        result.description,
        new Date(result.date),
        result.account,
        result.tags,
        result.metadata ? JSON.parse(result.metadata) : undefined,
        new Date(result.created_at),
        result.updated_at ? new Date(result.updated_at) : undefined,
        result.id
      ));
    } catch (error) {
      throw new Error(`Failed to find financial transactions by user ID and type: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find financial transactions by user ID and category
   */
  async findByUserIdAndCategory(
    userId: number, 
    category: string, 
    limit: number = 100
  ): Promise<FinancialTransaction[]> {
    try {
      const results = await this.knex(this.tableName)
        .where({
          user_id: userId,
          category
        })
        .orderBy([
          { column: 'date', order: 'desc' },
          { column: 'created_at', order: 'desc' }
        ])
        .limit(limit);
      
      // Map DB records to domain entities
      return results.map(result => new FinancialTransaction(
        result.user_id,
        parseFloat(result.amount),
        result.type,
        result.category,
        result.description,
        new Date(result.date),
        result.account,
        result.tags,
        result.metadata ? JSON.parse(result.metadata) : undefined,
        new Date(result.created_at),
        result.updated_at ? new Date(result.updated_at) : undefined,
        result.id
      ));
    } catch (error) {
      throw new Error(`Failed to find financial transactions by user ID and category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find financial transactions by date range
   */
  async findByDateRange(
    userId: number, 
    startDate: Date, 
    endDate: Date
  ): Promise<FinancialTransaction[]> {
    try {
      const results = await this.knex(this.tableName)
        .where('user_id', userId)
        .whereBetween('date', [startDate, endDate])
        .orderBy([
          { column: 'date', order: 'desc' },
          { column: 'created_at', order: 'desc' }
        ]);
      
      // Map DB records to domain entities
      return results.map(result => new FinancialTransaction(
        result.user_id,
        parseFloat(result.amount),
        result.type,
        result.category,
        result.description,
        new Date(result.date),
        result.account,
        result.tags,
        result.metadata ? JSON.parse(result.metadata) : undefined,
        new Date(result.created_at),
        result.updated_at ? new Date(result.updated_at) : undefined,
        result.id
      ));
    } catch (error) {
      throw new Error(`Failed to find financial transactions by date range: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a financial transaction
   */
  async update(transaction: FinancialTransaction): Promise<FinancialTransaction> {
    try {
      if (!transaction.id) {
        throw new Error('Cannot update financial transaction without ID');
      }
      
      const [result] = await this.knex(this.tableName)
        .where('id', transaction.id)
        .update({
          amount: transaction.amount,
          type: transaction.type,
          category: transaction.category,
          description: transaction.description,
          date: transaction.date,
          account: transaction.account || null,
          tags: transaction.tags || null,
          metadata: transaction.metadata ? JSON.stringify(transaction.metadata) : null
        })
        .returning('*');
      
      if (!result) {
        throw new Error(`Financial transaction with ID ${transaction.id} not found`);
      }
      
      // Map DB record to domain entity
      return new FinancialTransaction(
        result.user_id,
        parseFloat(result.amount),
        result.type,
        result.category,
        result.description,
        new Date(result.date),
        result.account,
        result.tags,
        result.metadata ? JSON.parse(result.metadata) : undefined,
        new Date(result.created_at),
        result.updated_at ? new Date(result.updated_at) : undefined,
        result.id
      );
    } catch (error) {
      throw new Error(`Failed to update financial transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a financial transaction by ID
   */
  async delete(id: number): Promise<boolean> {
    try {
      const deleted = await this.knex(this.tableName)
        .where('id', id)
        .delete();
      
      return deleted > 0;
    } catch (error) {
      throw new Error(`Failed to delete financial transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate total income for a user
   */
  async getTotalIncome(
    userId: number, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<number> {
    try {
      let query = this.knex(this.tableName)
        .where({
          user_id: userId,
          type: 'income'
        });
      
      if (startDate && endDate) {
        query = query.whereBetween('date', [startDate, endDate]);
      } else if (startDate) {
        query = query.where('date', '>=', startDate);
      } else if (endDate) {
        query = query.where('date', '<=', endDate);
      }
      
      const result = await query.sum('amount as total');
      const total = result[0]?.total;
      
      return parseFloat(total || '0');
    } catch (error) {
      throw new Error(`Failed to calculate total income: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate total expenses for a user
   */
  async getTotalExpenses(
    userId: number, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<number> {
    try {
      let query = this.knex(this.tableName)
        .where({
          user_id: userId,
          type: 'expense'
        });
      
      if (startDate && endDate) {
        query = query.whereBetween('date', [startDate, endDate]);
      } else if (startDate) {
        query = query.where('date', '>=', startDate);
      } else if (endDate) {
        query = query.where('date', '<=', endDate);
      }
      
      const result = await query.sum('amount as total');
      const total = result[0]?.total;
      
      return parseFloat(total || '0');
    } catch (error) {
      throw new Error(`Failed to calculate total expenses: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get summary of transactions by category
   */
  async getSummaryByCategory(
    userId: number, 
    type: 'income' | 'expense', 
    startDate?: Date, 
    endDate?: Date
  ): Promise<Map<string, number>> {
    try {
      let query = this.knex(this.tableName)
        .select('category')
        .sum('amount as total')
        .where({
          user_id: userId,
          type
        })
        .groupBy('category');
      
      if (startDate && endDate) {
        query = query.whereBetween('date', [startDate, endDate]);
      } else if (startDate) {
        query = query.where('date', '>=', startDate);
      } else if (endDate) {
        query = query.where('date', '<=', endDate);
      }
      
      const results = await query;
      
      // Convert to Map
      const summaryMap = new Map<string, number>();
      results.forEach(item => {
        summaryMap.set(item.category, parseFloat(item.total));
      });
      
      return summaryMap;
    } catch (error) {
      throw new Error(`Failed to get category summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}