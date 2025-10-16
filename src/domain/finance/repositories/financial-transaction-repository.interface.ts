/**
 * IFinancialTransactionRepository
 * 
 * Repository interface for FinancialTransaction entity operations
 */
import { FinancialTransaction } from '../entities';

export interface IFinancialTransactionRepository {
  /**
   * Save a new financial transaction
   * @param transaction The transaction to save
   * @returns The saved transaction with ID
   */
  save(transaction: FinancialTransaction): Promise<FinancialTransaction>;

  /**
   * Find a transaction by its ID
   * @param id The transaction ID
   * @returns The transaction if found, or null
   */
  findById(id: number): Promise<FinancialTransaction | null>;

  /**
   * Find transactions by user ID
   * @param userId The user ID
   * @param limit Maximum number of records to return
   * @returns Array of transactions
   */
  findByUserId(userId: number, limit?: number): Promise<FinancialTransaction[]>;
  
  /**
   * Find transactions by user ID and type
   * @param userId The user ID
   * @param type The transaction type
   * @param limit Maximum number of records to return
   * @returns Array of transactions
   */
  findByUserIdAndType(userId: number, type: 'income' | 'expense' | 'transfer', limit?: number): Promise<FinancialTransaction[]>;
  
  /**
   * Find transactions by user ID and category
   * @param userId The user ID
   * @param category The transaction category
   * @param limit Maximum number of records to return
   * @returns Array of transactions
   */
  findByUserIdAndCategory(userId: number, category: string, limit?: number): Promise<FinancialTransaction[]>;
  
  /**
   * Find transactions by date range
   * @param userId The user ID
   * @param startDate The start date
   * @param endDate The end date
   * @returns Array of transactions
   */
  findByDateRange(userId: number, startDate: Date, endDate: Date): Promise<FinancialTransaction[]>;
  
  /**
   * Update an existing transaction
   * @param transaction The transaction to update
   * @returns The updated transaction
   */
  update(transaction: FinancialTransaction): Promise<FinancialTransaction>;
  
  /**
   * Delete a transaction by ID
   * @param id The transaction ID to delete
   * @returns True if deleted, false otherwise
   */
  delete(id: number): Promise<boolean>;
  
  /**
   * Calculate total income for a user
   * @param userId The user ID
   * @param startDate Optional start date for filtering
   * @param endDate Optional end date for filtering
   * @returns Total income amount
   */
  getTotalIncome(userId: number, startDate?: Date, endDate?: Date): Promise<number>;
  
  /**
   * Calculate total expenses for a user
   * @param userId The user ID
   * @param startDate Optional start date for filtering
   * @param endDate Optional end date for filtering
   * @returns Total expense amount
   */
  getTotalExpenses(userId: number, startDate?: Date, endDate?: Date): Promise<number>;
  
  /**
   * Get summary of transactions by category
   * @param userId The user ID
   * @param type The transaction type
   * @param startDate Optional start date for filtering
   * @param endDate Optional end date for filtering
   * @returns Map of categories to total amounts
   */
  getSummaryByCategory(userId: number, type: 'income' | 'expense', startDate?: Date, endDate?: Date): Promise<Map<string, number>>;
}