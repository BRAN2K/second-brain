/**
 * ExtractFinancialDataUseCase
 * 
 * This use case is responsible for extracting financial data from transcribed text.
 */

import { IFinanceExtractionPort } from '../ports/finance-extraction.port';
import { ExtractedFinancialDataDTO, FinanceExtractionRequestDTO } from '../dtos';
import { FinancialTransaction, FinancialAccount, FinancialGoal } from '../entities';
import { ILoggerPort } from '../../common/ports/logger.port';

export class ExtractFinancialDataUseCase {
  constructor(
    private financeExtractionPort: IFinanceExtractionPort,
    private loggerPort: ILoggerPort
  ) {}

  /**
   * Execute the use case
   * @param request Contains the transcription text and metadata needed for extraction
   * @returns Extracted financial data
   */
  async execute(request: FinanceExtractionRequestDTO): Promise<ExtractedFinancialDataDTO> {
    try {
      this.loggerPort.info('Extracting financial data from transcription', {
        userId: request.userId,
        transcriptionLength: request.transcriptionText.length
      });
      
      // Use the extraction port to get raw extracted data
      const extractedData = await this.financeExtractionPort.extractFinancialData(
        request.transcriptionText,
        {
          userId: request.userId,
          username: request.username,
          audioDuration: request.audioDuration,
          timestamp: request.timestamp,
          transcriptionText: request.transcriptionText
        }
      );
      
      // Map raw data to domain entities
      const transactions: FinancialTransaction[] = [];
      const accounts: FinancialAccount[] = [];
      const goals: FinancialGoal[] = [];
      
      // Map transactions
      for (const transaction of extractedData.transactions) {
        if (transaction.amount && transaction.type && transaction.category && transaction.description) {
          try {
            transactions.push(
              new FinancialTransaction(
                request.userId,
                transaction.amount,
                transaction.type,
                transaction.category,
                transaction.description,
                transaction.date || new Date(),
                transaction.account,
                transaction.tags
              )
            );
          } catch (error) {
            this.loggerPort.warn('Error mapping transaction entity', { error });
          }
        }
      }
      
      // Map accounts
      for (const account of extractedData.accounts) {
        if (account.name && account.type) {
          try {
            accounts.push(
              new FinancialAccount(
                request.userId,
                account.name,
                account.type,
                account.bank,
                account.balance
              )
            );
          } catch (error) {
            this.loggerPort.warn('Error mapping account entity', { error });
          }
        }
      }
      
      // Map goals
      for (const goal of extractedData.goals) {
        if (goal.title && goal.targetAmount !== undefined && goal.currentAmount !== undefined && goal.category) {
          try {
            goals.push(
              new FinancialGoal(
                request.userId,
                goal.title,
                goal.targetAmount,
                goal.currentAmount,
                goal.category,
                goal.description,
                goal.targetDate
              )
            );
          } catch (error) {
            this.loggerPort.warn('Error mapping goal entity', { error });
          }
        }
      }
      
      return {
        transactions,
        accounts,
        goals,
        notes: extractedData.notes || [],
        confidence: extractedData.confidence,
        userId: request.userId,
        timestamp: request.timestamp
      };
    } catch (error) {
      this.loggerPort.error('Error extracting financial data', { error });
      throw error;
    }
  }
}