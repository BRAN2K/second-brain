/**
 * ExtractedFinancialDataDTO
 * 
 * Data transfer object for extracted financial data
 */
import { FinancialAccount } from '../entities/financial-account.entity';
import { FinancialGoal } from '../entities/financial-goal.entity';
import { FinancialTransaction } from '../entities/financial-transaction.entity';

export interface ExtractedFinancialDataDTO {
  /** List of extracted financial transactions */
  transactions: FinancialTransaction[];
  
  /** List of extracted financial accounts */
  accounts: FinancialAccount[];
  
  /** List of extracted financial goals */
  goals: FinancialGoal[];
  
  /** Additional notes extracted from the text */
  notes: string[];
  
  /** Confidence score of the extraction (0-1) */
  confidence: number;
  
  /** User ID associated with this extraction */
  userId: number;
  
  /** Timestamp of when the extraction was performed */
  timestamp: Date;
}