/**
 * IFinanceExtractionPort
 * 
 * Port interface for extracting financial data from text.
 * This is implemented by adapters that connect to external services
 * like Gemini AI for financial data extraction.
 */

import { ExtractedFinancialDataDTO } from "../dtos/extracted-financial-data.dto";
import { FinanceExtractionMetadataDTO } from "../dtos/finance-extraction-metadata.dto";

export interface IFinanceExtractionPort {
  /**
   * Extract financial data from transcription text
   * @param transcriptionText Text to extract financial data from
   * @param metadata Additional metadata for extraction
   * @returns Extracted financial data
   */
  extractFinancialData(
    transcriptionText: string,
    metadata: FinanceExtractionMetadataDTO
  ): Promise<ExtractedFinancialDataDTO>;
}