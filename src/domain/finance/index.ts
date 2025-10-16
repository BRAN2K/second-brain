/**
 * Finance domain module
 * 
 * Contains all business logic related to financial transactions,
 * accounts, goals, and related operations.
 */

// Re-export specific exports instead of using * to avoid naming conflicts
export * from './entities';
export * from './repositories';

// Export from dtos/index.ts but rename any conflicting exports
export {
  FinanceExtractionRequestDTO,
  FinanceExtractionResponseDTO,
  FinanceExtractionMetadataDTO,
  ExtractedFinancialDataDTO,
  // Rename conflicting exports
  FinancialSummaryDTO as FinancialSummaryDataDTO
} from './dtos';

// Export from use-cases but rename any conflicting exports
export {
  ExtractFinancialDataUseCase,
  SaveFinancialDataUseCase,
  GetFinancialSummaryUseCase
} from './use-cases';

// Export from ports
export {
  IFinanceExtractionPort
} from './ports';