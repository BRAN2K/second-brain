/**
 * IFinancialGoalRepository
 * 
 * Repository interface for FinancialGoal entity operations
 */
import { FinancialGoal } from '../entities';

export interface IFinancialGoalRepository {
  /**
   * Save a new financial goal
   * @param goal The goal to save
   * @returns The saved goal with ID
   */
  save(goal: FinancialGoal): Promise<FinancialGoal>;

  /**
   * Find a goal by its ID
   * @param id The goal ID
   * @returns The goal if found, or null
   */
  findById(id: number): Promise<FinancialGoal | null>;

  /**
   * Find goals by user ID
   * @param userId The user ID
   * @returns Array of goals
   */
  findByUserId(userId: number): Promise<FinancialGoal[]>;
  
  /**
   * Find active goals by user ID
   * @param userId The user ID
   * @returns Array of active goals
   */
  findActiveByUserId(userId: number): Promise<FinancialGoal[]>;
  
  /**
   * Find goals by user ID and status
   * @param userId The user ID
   * @param status The goal status
   * @returns Array of goals
   */
  findByUserIdAndStatus(userId: number, status: 'active' | 'completed' | 'paused' | 'cancelled'): Promise<FinancialGoal[]>;
  
  /**
   * Find goals by user ID and category
   * @param userId The user ID
   * @param category The goal category
   * @returns Array of goals
   */
  findByUserIdAndCategory(userId: number, category: string): Promise<FinancialGoal[]>;
  
  /**
   * Find overdue goals by user ID
   * @param userId The user ID
   * @returns Array of overdue goals
   */
  findOverdueByUserId(userId: number): Promise<FinancialGoal[]>;
  
  /**
   * Find goals nearing target date by user ID
   * @param userId The user ID
   * @param daysThreshold The number of days to consider "near"
   * @returns Array of goals nearing target date
   */
  findNearingTargetDate(userId: number, daysThreshold: number): Promise<FinancialGoal[]>;
  
  /**
   * Update an existing goal
   * @param goal The goal to update
   * @returns The updated goal
   */
  update(goal: FinancialGoal): Promise<FinancialGoal>;
  
  /**
   * Delete a goal by ID
   * @param id The goal ID to delete
   * @returns True if deleted, false otherwise
   */
  delete(id: number): Promise<boolean>;
  
  /**
   * Calculate average completion percentage of active goals
   * @param userId The user ID
   * @returns Average completion percentage
   */
  getAverageCompletion(userId: number): Promise<number>;
}