/**
 * FinanceExtractionResponseDTO
 * 
 * Data transfer object for finance extraction response.
 */

import { ExtractedFinancialDataDTO } from './extracted-financial-data.dto';

export interface FinanceExtractionResponseDTO {
  /** The extracted financial data */
  data: ExtractedFinancialDataDTO;
  
  /** Status of the extraction */
  status: 'success' | 'partial' | 'failed';
  
  /** Processing time in milliseconds */
  processingTime?: number;
  
  /** Any error message if status is 'failed' or 'partial' */
  errorMessage?: string;
  
  /** Timestamp when the extraction was completed */
  timestamp: Date;
}