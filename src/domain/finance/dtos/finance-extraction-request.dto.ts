/**
 * FinanceExtractionRequestDTO
 * 
 * Data transfer object for requesting financial data extraction
 */
export interface FinanceExtractionRequestDTO {
  /** User ID requesting the extraction */
  userId: number;
  
  /** Optional username */
  username?: string;
  
  /** Text to extract financial data from */
  transcriptionText: string;
  
  /** Duration of the audio in seconds */
  audioDuration?: number;
  
  /** Timestamp of when the extraction was requested */
  timestamp: Date;
}