/**
 * GeminiFinanceExtractionAdapter
 * 
 * Implements the IFinanceExtractionPort using Gemini AI for financial data extraction.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ILoggerPort } from '../../../domain/common/ports/logger.port';
import { IFinanceExtractionPort } from '../../../domain/finance/ports';
import { 
  ExtractedFinancialDataDTO,
  FinanceExtractionMetadataDTO 
} from '../../../domain/finance/dtos';

export class GeminiFinanceExtractionAdapter implements IFinanceExtractionPort {
  private model: any;
  private generativeAI: GoogleGenerativeAI;
  private logger?: ILoggerPort;

  constructor(apiKey: string, logger?: ILoggerPort) {
    this.generativeAI = new GoogleGenerativeAI(apiKey);
    this.model = this.generativeAI.getGenerativeModel({ model: "gemini-pro" });
    this.logger = logger;
  }

  /**
   * Extract financial data from text using the Gemini model
   */
  async extractFinancialData(
    text: string,
    metadata: FinanceExtractionMetadataDTO
  ): Promise<ExtractedFinancialDataDTO> {
    try {
      this.logger?.info(`Extracting financial data from text: ${text.slice(0, 50)}...`);

      // Create prompt for the model
      const prompt = `
        Analyze the following text and extract all financial information in JSON format.
        
        Text: "${text}"
        
        Extract the following information if present:
        1. Transactions: expenses, income, or transfers (amount, description, category, type)
        2. Accounts mentioned (name, bank, type)
        3. Financial goals (title, target amount)
        4. Financial notes
        
        Return only JSON, without additional explanations, in the format:
        {
          "transactions": [
            {"amount": number, "description": string, "category": string, "type": "income"|"expense"|"transfer"}
          ],
          "accounts": [
            {"name": string, "bank": string, "type": string}
          ],
          "goals": [
            {"title": string, "targetAmount": number}
          ],
          "notes": [string],
          "confidence": number (between 0 and 1)
        }
      `;

      // Call the Gemini API to extract financial information
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const jsonText = response.text();

      // Try to parse the JSON
      try {
        const financialData = JSON.parse(jsonText);
        this.logger?.info(`Financial data extracted successfully: ${JSON.stringify(financialData).slice(0, 100)}...`);
        
        // Map the raw extraction to our DTO format
        return {
          transactions: financialData.transactions || [],
          accounts: financialData.accounts || [],
          goals: financialData.goals || [],
          notes: financialData.notes || [],
          confidence: financialData.confidence || 0,
          userId: metadata.userId,
          timestamp: new Date()
        };
      } catch (parseError) {
        this.logger?.error('Error parsing JSON:', parseError);
        throw new Error('Failed to analyze financial data: invalid JSON format');
      }
    } catch (error) {
      this.logger?.error('Error extracting financial data:', error);
      throw new Error(`Failed to extract financial data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}