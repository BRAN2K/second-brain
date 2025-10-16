/**
 * ExtractedFinancialDataDTO
 * 
 * Data transfer object for extracted financial data
 */
import { FinancialTransaction, FinancialAccount, FinancialGoal } from '../entities';

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