/**
 * FinancialSummaryDTO
 * 
 * Data transfer object for financial summary data.
 */

import { FinancialAccount, FinancialGoal, FinancialTransaction } from '../entities';

export interface FinancialSummaryDTO {
  /** User ID for this summary */
  userId: number;
  
  /** Summary period start date */
  startDate: Date;
  
  /** Summary period end date */
  endDate: Date;
  
  /** Total income for the period */
  totalIncome: number;
  
  /** Total expenses for the period */
  totalExpenses: number;
  
  /** Net balance (income - expenses) */
  netBalance: number;
  
  /** Transaction breakdown by category */
  categorySummary: {
    /** Category name */
    category: string;
    
    /** Total amount for category */
    amount: number;
    
    /** Percentage of total (expenses or income) */
    percentage: number;
    
    /** Transaction count in category */
    count: number;
  }[];
  
  /** List of transactions */
  transactions: FinancialTransaction[];
  
  /** List of accounts */
  accounts: FinancialAccount[];
  
  /** List of active goals */
  goals: FinancialGoal[];
  
  /** Average goal completion percentage */
  averageGoalCompletion: number;
  
  /** Timestamp when the summary was generated */
  timestamp: Date;
}