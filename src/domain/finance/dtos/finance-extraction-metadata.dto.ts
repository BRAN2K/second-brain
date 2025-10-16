/**
 * FinanceExtractionMetadataDTO
 * 
 * Data transfer object for metadata related to finance extraction
 */
export interface FinanceExtractionMetadataDTO {
  /** User ID requesting the extraction */
  userId: number;
  
  /** Optional username */
  username?: string;
  
  /** Duration of the audio in seconds */
  audioDuration?: number;
  
  /** Text to extract financial data from */
  transcriptionText: string;
  
  /** Timestamp of when the extraction was requested */
  timestamp: Date;
}