/**
 * PostgresFinancialGoalRepository
 * 
 * Implements the IFinancialGoalRepository interface using PostgreSQL database.
 */
import { Knex } from 'knex';
import { FinancialGoal } from '../../../domain/finance/entities';
import { IFinancialGoalRepository } from '../../../domain/finance/repositories';
import { IDatabaseAdapter } from './database-adapter.interface';
import { PostgresAdapter } from './postgres-adapter';

export class PostgresFinancialGoalRepository implements IFinancialGoalRepository {
  private knex: Knex;
  private readonly tableName = 'financial_goals';

  constructor(databaseAdapter?: IDatabaseAdapter) {
    if (databaseAdapter) {
      this.knex = databaseAdapter.getKnex();
    } else {
      const postgresAdapter = new PostgresAdapter();
      this.knex = postgresAdapter.getKnex();
    }
  }

  /**
   * Save a financial goal to the database
   */
  async save(goal: FinancialGoal): Promise<FinancialGoal> {
    try {
      const [result] = await this.knex(this.tableName)
        .insert({
          user_id: goal.userId,
          name: goal.title, // Note: DB uses 'name' field instead of 'title'
          description: goal.description || null,
          target_amount: goal.targetAmount,
          current_amount: goal.currentAmount,
          target_date: goal.targetDate || null,
          status: goal.status || 'active',
          category: goal.category,
          created_at: goal.createdAt
        })
        .returning('*');
      
      // Map DB record to domain entity
      return new FinancialGoal(
        result.user_id,
        result.name, // Map 'name' to 'title'
        result.target_amount,
        result.current_amount,
        result.category,
        result.description,
        result.target_date ? new Date(result.target_date) : undefined,
        result.status,
        new Date(result.created_at),
        result.updated_at ? new Date(result.updated_at) : undefined,
        result.id
      );
    } catch (error) {
      throw new Error(`Failed to save financial goal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find a financial goal by its ID
   */
  async findById(id: number): Promise<FinancialGoal | null> {
    try {
      const result = await this.knex(this.tableName)
        .where('id', id)
        .first();
      
      if (!result) {
        return null;
      }
      
      // Map DB record to domain entity
      return new FinancialGoal(
        result.user_id,
        result.name, // Map 'name' to 'title'
        result.target_amount,
        result.current_amount,
        result.category,
        result.description,
        result.target_date ? new Date(result.target_date) : undefined,
        result.status,
        new Date(result.created_at),
        result.updated_at ? new Date(result.updated_at) : undefined,
        result.id
      );
    } catch (error) {
      throw new Error(`Failed to find financial goal by ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find financial goals by user ID
   */
  async findByUserId(userId: number): Promise<FinancialGoal[]> {
    try {
      const results = await this.knex(this.tableName)
        .where('user_id', userId)
        .orderBy([
          { column: 'target_date', order: 'asc' },
          { column: 'created_at', order: 'desc' }
        ]);
      
      // Map DB records to domain entities
      return results.map(result => new FinancialGoal(
        result.user_id,
        result.name, // Map 'name' to 'title'
        result.target_amount,
        result.current_amount,
        result.category,
        result.description,
        result.target_date ? new Date(result.target_date) : undefined,
        result.status,
        new Date(result.created_at),
        result.updated_at ? new Date(result.updated_at) : undefined,
        result.id
      ));
    } catch (error) {
      throw new Error(`Failed to find financial goals by user ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find active financial goals by user ID
   */
  async findActiveByUserId(userId: number): Promise<FinancialGoal[]> {
    try {
      const results = await this.knex(this.tableName)
        .where({
          user_id: userId,
          status: 'active'
        })
        .orderBy([
          { column: 'target_date', order: 'asc' },
          { column: 'created_at', order: 'desc' }
        ]);
      
      // Map DB records to domain entities
      return results.map(result => new FinancialGoal(
        result.user_id,
        result.name, // Map 'name' to 'title'
        result.target_amount,
        result.current_amount,
        result.category,
        result.description,
        result.target_date ? new Date(result.target_date) : undefined,
        result.status,
        new Date(result.created_at),
        result.updated_at ? new Date(result.updated_at) : undefined,
        result.id
      ));
    } catch (error) {
      throw new Error(`Failed to find active financial goals by user ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find financial goals by user ID and status
   */
  async findByUserIdAndStatus(
    userId: number, 
    status: 'active' | 'completed' | 'paused' | 'cancelled'
  ): Promise<FinancialGoal[]> {
    try {
      const results = await this.knex(this.tableName)
        .where({
          user_id: userId,
          status
        })
        .orderBy([
          { column: 'target_date', order: 'asc' },
          { column: 'created_at', order: 'desc' }
        ]);
      
      // Map DB records to domain entities
      return results.map(result => new FinancialGoal(
        result.user_id,
        result.name, // Map 'name' to 'title'
        result.target_amount,
        result.current_amount,
        result.category,
        result.description,
        result.target_date ? new Date(result.target_date) : undefined,
        result.status,
        new Date(result.created_at),
        result.updated_at ? new Date(result.updated_at) : undefined,
        result.id
      ));
    } catch (error) {
      throw new Error(`Failed to find financial goals by user ID and status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find financial goals by user ID and category
   */
  async findByUserIdAndCategory(
    userId: number, 
    category: string
  ): Promise<FinancialGoal[]> {
    try {
      const results = await this.knex(this.tableName)
        .where({
          user_id: userId,
          category
        })
        .orderBy([
          { column: 'target_date', order: 'asc' },
          { column: 'created_at', order: 'desc' }
        ]);
      
      // Map DB records to domain entities
      return results.map(result => new FinancialGoal(
        result.user_id,
        result.name, // Map 'name' to 'title'
        result.target_amount,
        result.current_amount,
        result.category,
        result.description,
        result.target_date ? new Date(result.target_date) : undefined,
        result.status,
        new Date(result.created_at),
        result.updated_at ? new Date(result.updated_at) : undefined,
        result.id
      ));
    } catch (error) {
      throw new Error(`Failed to find financial goals by user ID and category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find overdue financial goals by user ID
   */
  async findOverdueByUserId(userId: number): Promise<FinancialGoal[]> {
    try {
      const today = new Date();
      const results = await this.knex(this.tableName)
        .where({
          user_id: userId,
          status: 'active'
        })
        .whereNotNull('target_date')
        .where('target_date', '<', today)
        .orderBy('target_date', 'asc');
      
      // Map DB records to domain entities
      return results.map(result => new FinancialGoal(
        result.user_id,
        result.name, // Map 'name' to 'title'
        result.target_amount,
        result.current_amount,
        result.category,
        result.description,
        result.target_date ? new Date(result.target_date) : undefined,
        result.status,
        new Date(result.created_at),
        result.updated_at ? new Date(result.updated_at) : undefined,
        result.id
      ));
    } catch (error) {
      throw new Error(`Failed to find overdue financial goals by user ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find financial goals nearing target date by user ID
   */
  async findNearingTargetDate(
    userId: number, 
    daysThreshold: number
  ): Promise<FinancialGoal[]> {
    try {
      const today = new Date();
      const threshold = new Date();
      threshold.setDate(today.getDate() + daysThreshold);
      
      const results = await this.knex(this.tableName)
        .where({
          user_id: userId,
          status: 'active'
        })
        .whereNotNull('target_date')
        .where('target_date', '>=', today)
        .where('target_date', '<=', threshold)
        .orderBy('target_date', 'asc');
      
      // Map DB records to domain entities
      return results.map(result => new FinancialGoal(
        result.user_id,
        result.name, // Map 'name' to 'title'
        result.target_amount,
        result.current_amount,
        result.category,
        result.description,
        result.target_date ? new Date(result.target_date) : undefined,
        result.status,
        new Date(result.created_at),
        result.updated_at ? new Date(result.updated_at) : undefined,
        result.id
      ));
    } catch (error) {
      throw new Error(`Failed to find financial goals nearing target date: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a financial goal
   */
  async update(goal: FinancialGoal): Promise<FinancialGoal> {
    try {
      if (!goal.id) {
        throw new Error('Cannot update financial goal without ID');
      }
      
      const [result] = await this.knex(this.tableName)
        .where('id', goal.id)
        .update({
          name: goal.title, // Note: DB uses 'name' field instead of 'title'
          description: goal.description || null,
          target_amount: goal.targetAmount,
          current_amount: goal.currentAmount,
          target_date: goal.targetDate || null,
          status: goal.status,
          category: goal.category
        })
        .returning('*');
      
      if (!result) {
        throw new Error(`Financial goal with ID ${goal.id} not found`);
      }
      
      // Map DB record to domain entity
      return new FinancialGoal(
        result.user_id,
        result.name, // Map 'name' to 'title'
        result.target_amount,
        result.current_amount,
        result.category,
        result.description,
        result.target_date ? new Date(result.target_date) : undefined,
        result.status,
        new Date(result.created_at),
        result.updated_at ? new Date(result.updated_at) : undefined,
        result.id
      );
    } catch (error) {
      throw new Error(`Failed to update financial goal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a financial goal by ID
   */
  async delete(id: number): Promise<boolean> {
    try {
      const deleted = await this.knex(this.tableName)
        .where('id', id)
        .delete();
      
      return deleted > 0;
    } catch (error) {
      throw new Error(`Failed to delete financial goal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate average completion percentage of active goals
   */
  async getAverageCompletion(userId: number): Promise<number> {
    try {
      const goals = await this.findActiveByUserId(userId);
      
      if (goals.length === 0) {
        return 0;
      }
      
      const totalPercentage = goals.reduce((sum, goal) => {
        const percentage = (goal.currentAmount / goal.targetAmount) * 100;
        return sum + percentage;
      }, 0);
      
      return totalPercentage / goals.length;
    } catch (error) {
      throw new Error(`Failed to calculate average goal completion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}