/**
 * SaveFinancialDataUseCase
 * 
 * This use case saves extracted financial data to repositories.
 */

import { IFinancialTransactionRepository, IFinancialAccountRepository, IFinancialGoalRepository } from '../repositories';
import { ExtractedFinancialDataDTO } from '../dtos';
import { ILoggerPort } from '../../common/ports';

export class SaveFinancialDataUseCase {
  constructor(
    private transactionRepository: IFinancialTransactionRepository,
    private accountRepository: IFinancialAccountRepository,
    private goalRepository: IFinancialGoalRepository,
    private loggerPort: ILoggerPort
  ) {}

  /**
   * Execute the use case
   * @param data Extracted financial data to save
   * @returns Result containing saved entity IDs
   */
  async execute(data: ExtractedFinancialDataDTO): Promise<{
    transactionIds: number[];
    accountIds: number[];
    goalIds: number[];
  }> {
    try {
      this.loggerPort.info('Saving financial data', {
        userId: data.userId,
        transactions: data.transactions.length,
        accounts: data.accounts.length,
        goals: data.goals.length
      });
      
      // Save transactions
      const transactionIds: number[] = [];
      for (const transaction of data.transactions) {
        try {
          const saved = await this.transactionRepository.save(transaction);
          if (saved.id) {
            transactionIds.push(saved.id);
          }
        } catch (error) {
          this.loggerPort.warn('Error saving transaction', { error, transaction });
        }
      }
      
      // Save accounts - first check if they already exist to avoid duplicates
      const accountIds: number[] = [];
      for (const account of data.accounts) {
        try {
          // Check if account with same name already exists for this user
          const existingAccount = await this.accountRepository.findByUserIdAndName(
            account.userId,
            account.name
          );
          
          if (existingAccount) {
            // Update existing account if needed
            if (account.balance !== undefined && existingAccount.balance !== account.balance) {
              existingAccount.updateBalance(account.balance);
              const updated = await this.accountRepository.update(existingAccount);
              if (updated.id) {
                accountIds.push(updated.id);
              }
            } else {
              // Just add the existing ID
              if (existingAccount.id) {
                accountIds.push(existingAccount.id);
              }
            }
          } else {
            // Create new account
            const saved = await this.accountRepository.save(account);
            if (saved.id) {
              accountIds.push(saved.id);
            }
          }
        } catch (error) {
          this.loggerPort.warn('Error saving account', { error, account });
        }
      }
      
      // Save goals
      const goalIds: number[] = [];
      for (const goal of data.goals) {
        try {
          const saved = await this.goalRepository.save(goal);
          if (saved.id) {
            goalIds.push(saved.id);
          }
        } catch (error) {
          this.loggerPort.warn('Error saving goal', { error, goal });
        }
      }
      
      this.loggerPort.info('Financial data saved successfully', {
        savedTransactions: transactionIds.length,
        savedAccounts: accountIds.length,
        savedGoals: goalIds.length
      });
      
      return {
        transactionIds,
        accountIds,
        goalIds
      };
    } catch (error) {
      this.loggerPort.error('Error saving financial data', { error });
      throw error;
    }
  }
}