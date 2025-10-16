/**
 * IFinancialAccountRepository
 * 
 * Repository interface for FinancialAccount entity operations
 */
import { FinancialAccount } from '../entities';

export interface IFinancialAccountRepository {
  /**
   * Save a new financial account
   * @param account The account to save
   * @returns The saved account with ID
   */
  save(account: FinancialAccount): Promise<FinancialAccount>;

  /**
   * Find an account by its ID
   * @param id The account ID
   * @returns The account if found, or null
   */
  findById(id: number): Promise<FinancialAccount | null>;

  /**
   * Find accounts by user ID
   * @param userId The user ID
   * @returns Array of accounts
   */
  findByUserId(userId: number): Promise<FinancialAccount[]>;
  
  /**
   * Find active accounts by user ID
   * @param userId The user ID
   * @returns Array of active accounts
   */
  findActiveByUserId(userId: number): Promise<FinancialAccount[]>;
  
  /**
   * Find accounts by user ID and type
   * @param userId The user ID
   * @param type The account type
   * @returns Array of accounts
   */
  findByUserIdAndType(userId: number, type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash'): Promise<FinancialAccount[]>;
  
  /**
   * Find an account by name for a user
   * @param userId The user ID
   * @param name The account name
   * @returns The account if found, or null
   */
  findByUserIdAndName(userId: number, name: string): Promise<FinancialAccount | null>;
  
  /**
   * Update an existing account
   * @param account The account to update
   * @returns The updated account
   */
  update(account: FinancialAccount): Promise<FinancialAccount>;
  
  /**
   * Delete an account by ID
   * @param id The account ID to delete
   * @returns True if deleted, false otherwise
   */
  delete(id: number): Promise<boolean>;
  
  /**
   * Get total balance of all accounts for a user
   * @param userId The user ID
   * @param includeCredit Whether to include credit accounts in the total
   * @returns Total balance
   */
  getTotalBalance(userId: number, includeCredit?: boolean): Promise<number>;
}