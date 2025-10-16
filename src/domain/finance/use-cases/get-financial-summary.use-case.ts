/**
 * GetFinancialSummaryUseCase
 * 
 * This use case retrieves a summary of financial data for a user.
 */

import { IFinancialTransactionRepository, IFinancialAccountRepository, IFinancialGoalRepository } from '../repositories';
import { ILoggerPort } from '../../common/ports';

export interface FinancialSummaryDTO {
  userId: number;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  accountCount: number;
  goalCount: number;
  activeGoalsCompletion: number;
  recentTransactions: number;
  categorySummary: Map<string, number>;
  period: {
    startDate: Date;
    endDate: Date;
  };
}

export class GetFinancialSummaryUseCase {
  constructor(
    private transactionRepository: IFinancialTransactionRepository,
    private accountRepository: IFinancialAccountRepository,
    private goalRepository: IFinancialGoalRepository,
    private loggerPort: ILoggerPort
  ) {}

  /**
   * Execute the use case
   * @param userId User ID to get summary for
   * @param startDate Optional start date for filtering
   * @param endDate Optional end date for filtering
   * @returns Financial summary data
   */
  async execute(
    userId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<FinancialSummaryDTO> {
    try {
      this.loggerPort.info('Getting financial summary', { userId, startDate, endDate });
      
      // Set default period if not provided
      const effectiveEndDate = endDate || new Date();
      const effectiveStartDate = startDate || new Date();
      if (!startDate) {
        // Default to 30 days ago if not specified
        effectiveStartDate.setDate(effectiveStartDate.getDate() - 30);
      }
      
      // Get income and expenses
      const totalIncome = await this.transactionRepository.getTotalIncome(
        userId,
        effectiveStartDate,
        effectiveEndDate
      );
      
      const totalExpenses = await this.transactionRepository.getTotalExpenses(
        userId,
        effectiveStartDate,
        effectiveEndDate
      );
      
      // Get account count
      const accounts = await this.accountRepository.findActiveByUserId(userId);
      
      // Get total balance across all non-credit accounts
      const accountBalance = await this.accountRepository.getTotalBalance(userId, false);
      
      // Get goals
      const goals = await this.goalRepository.findByUserId(userId);
      const activeGoals = await this.goalRepository.findActiveByUserId(userId);
      
      // Get average completion percentage for active goals
      const averageGoalCompletion = await this.goalRepository.getAverageCompletion(userId);
      
      // Get category summary for expenses
      const categorySummary = await this.transactionRepository.getSummaryByCategory(
        userId,
        'expense',
        effectiveStartDate,
        effectiveEndDate
      );
      
      // Calculate net balance (income - expenses)
      const netBalance = totalIncome - totalExpenses;
      
      // Get recent transaction count
      const transactions = await this.transactionRepository.findByDateRange(
        userId,
        effectiveStartDate,
        effectiveEndDate
      );
      
      return {
        userId,
        totalIncome,
        totalExpenses,
        netBalance,
        accountCount: accounts.length,
        goalCount: goals.length,
        activeGoalsCompletion: averageGoalCompletion,
        recentTransactions: transactions.length,
        categorySummary,
        period: {
          startDate: effectiveStartDate,
          endDate: effectiveEndDate
        }
      };
    } catch (error) {
      this.loggerPort.error('Error getting financial summary', { error, userId });
      throw error;
    }
  }
}