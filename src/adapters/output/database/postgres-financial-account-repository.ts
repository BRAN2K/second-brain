/**
 * PostgresFinancialAccountRepository
 * 
 * Implements the IFinancialAccountRepository interface using PostgreSQL database.
 */
import { Knex } from 'knex';
import { FinancialAccount } from '../../../domain/finance/entities';
import { IFinancialAccountRepository } from '../../../domain/finance/repositories';
import { IDatabaseAdapter } from './database-adapter.interface';
import { PostgresAdapter } from './postgres-adapter';

export class PostgresFinancialAccountRepository implements IFinancialAccountRepository {
  private knex: Knex;
  private readonly tableName = 'financial_accounts';

  constructor(databaseAdapter?: IDatabaseAdapter) {
    if (databaseAdapter) {
      this.knex = databaseAdapter.getKnex();
    } else {
      const postgresAdapter = new PostgresAdapter();
      this.knex = postgresAdapter.getKnex();
    }
  }

  /**
   * Save a financial account to the database
   */
  async save(account: FinancialAccount): Promise<FinancialAccount> {
    try {
      const [result] = await this.knex(this.tableName)
        .insert({
          user_id: account.userId,
          name: account.name,
          type: account.type,
          bank: account.bank || null,
          balance: account.balance || null,
          is_active: account.isActive,
          created_at: account.createdAt
        })
        .returning('*');
      
      // Map DB record to domain entity
      return new FinancialAccount(
        result.user_id,
        result.name,
        result.type,
        result.bank,
        result.balance ? parseFloat(result.balance) : undefined,
        result.is_active,
        new Date(result.created_at),
        result.updated_at ? new Date(result.updated_at) : undefined,
        result.id
      );
    } catch (error) {
      throw new Error(`Failed to save financial account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find a financial account by its ID
   */
  async findById(id: number): Promise<FinancialAccount | null> {
    try {
      const result = await this.knex(this.tableName)
        .where('id', id)
        .first();
      
      if (!result) {
        return null;
      }
      
      // Map DB record to domain entity
      return new FinancialAccount(
        result.user_id,
        result.name,
        result.type,
        result.bank,
        result.balance ? parseFloat(result.balance) : undefined,
        result.is_active,
        new Date(result.created_at),
        result.updated_at ? new Date(result.updated_at) : undefined,
        result.id
      );
    } catch (error) {
      throw new Error(`Failed to find financial account by ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find financial accounts by user ID
   */
  async findByUserId(userId: number): Promise<FinancialAccount[]> {
    try {
      const results = await this.knex(this.tableName)
        .where('user_id', userId)
        .orderBy('created_at', 'desc');
      
      // Map DB records to domain entities
      return results.map(result => new FinancialAccount(
        result.user_id,
        result.name,
        result.type,
        result.bank,
        result.balance ? parseFloat(result.balance) : undefined,
        result.is_active,
        new Date(result.created_at),
        result.updated_at ? new Date(result.updated_at) : undefined,
        result.id
      ));
    } catch (error) {
      throw new Error(`Failed to find financial accounts by user ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find active financial accounts by user ID
   */
  async findActiveByUserId(userId: number): Promise<FinancialAccount[]> {
    try {
      const results = await this.knex(this.tableName)
        .where({
          user_id: userId,
          is_active: true
        })
        .orderBy('created_at', 'desc');
      
      // Map DB records to domain entities
      return results.map(result => new FinancialAccount(
        result.user_id,
        result.name,
        result.type,
        result.bank,
        result.balance ? parseFloat(result.balance) : undefined,
        result.is_active,
        new Date(result.created_at),
        result.updated_at ? new Date(result.updated_at) : undefined,
        result.id
      ));
    } catch (error) {
      throw new Error(`Failed to find active financial accounts by user ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find financial accounts by user ID and type
   */
  async findByUserIdAndType(
    userId: number, 
    type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash'
  ): Promise<FinancialAccount[]> {
    try {
      const results = await this.knex(this.tableName)
        .where({
          user_id: userId,
          type
        })
        .orderBy('created_at', 'desc');
      
      // Map DB records to domain entities
      return results.map(result => new FinancialAccount(
        result.user_id,
        result.name,
        result.type,
        result.bank,
        result.balance ? parseFloat(result.balance) : undefined,
        result.is_active,
        new Date(result.created_at),
        result.updated_at ? new Date(result.updated_at) : undefined,
        result.id
      ));
    } catch (error) {
      throw new Error(`Failed to find financial accounts by user ID and type: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find a financial account by name for a user
   */
  async findByUserIdAndName(userId: number, name: string): Promise<FinancialAccount | null> {
    try {
      const result = await this.knex(this.tableName)
        .where({
          user_id: userId,
          name
        })
        .first();
      
      if (!result) {
        return null;
      }
      
      // Map DB record to domain entity
      return new FinancialAccount(
        result.user_id,
        result.name,
        result.type,
        result.bank,
        result.balance ? parseFloat(result.balance) : undefined,
        result.is_active,
        new Date(result.created_at),
        result.updated_at ? new Date(result.updated_at) : undefined,
        result.id
      );
    } catch (error) {
      throw new Error(`Failed to find financial account by user ID and name: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a financial account
   */
  async update(account: FinancialAccount): Promise<FinancialAccount> {
    try {
      if (!account.id) {
        throw new Error('Cannot update financial account without ID');
      }
      
      const [result] = await this.knex(this.tableName)
        .where('id', account.id)
        .update({
          name: account.name,
          type: account.type,
          bank: account.bank || null,
          balance: account.balance || null,
          is_active: account.isActive
        })
        .returning('*');
      
      if (!result) {
        throw new Error(`Financial account with ID ${account.id} not found`);
      }
      
      // Map DB record to domain entity
      return new FinancialAccount(
        result.user_id,
        result.name,
        result.type,
        result.bank,
        result.balance ? parseFloat(result.balance) : undefined,
        result.is_active,
        new Date(result.created_at),
        result.updated_at ? new Date(result.updated_at) : undefined,
        result.id
      );
    } catch (error) {
      throw new Error(`Failed to update financial account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a financial account by ID
   */
  async delete(id: number): Promise<boolean> {
    try {
      const deleted = await this.knex(this.tableName)
        .where('id', id)
        .delete();
      
      return deleted > 0;
    } catch (error) {
      throw new Error(`Failed to delete financial account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get total balance of all accounts for a user
   */
  async getTotalBalance(userId: number, includeCredit: boolean = false): Promise<number> {
    try {
      let query = this.knex(this.tableName)
        .where({
          user_id: userId,
          is_active: true
        });
      
      if (!includeCredit) {
        query = query.whereNot('type', 'credit');
      }
      
      const result = await query.sum('balance as total');
      const total = result[0]?.total;
      
      return parseFloat(total || '0');
    } catch (error) {
      throw new Error(`Failed to calculate total balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}