/**
 * Dependency Injection Container
 * 
 * This module creates and configures all dependencies used in the application.
 * It serves as a central place for wiring up all components.
 */
import { Knex } from 'knex';
import { Telegraf } from 'telegraf';

// Domain Ports
import { ILoggerPort } from '../domain/common/ports/logger.port';
import { ISpeechToTextPort } from '../domain/transcription/ports';
import { IFinanceExtractionPort } from '../domain/finance/ports';

// Domain Repositories
import { 
  ITranscriptionRepository 
} from '../domain/transcription/repositories';
import {
  IFinancialTransactionRepository,
  IFinancialAccountRepository,
  IFinancialGoalRepository
} from '../domain/finance/repositories';

// Domain Use Cases
import {
  TranscribeAudioUseCase,
  SaveTranscriptionUseCase
} from '../domain/transcription/use-cases';
import {
  ExtractFinancialDataUseCase,
  SaveFinancialDataUseCase,
  GetFinancialSummaryUseCase
} from '../domain/finance/use-cases';

// Adapters - Output
import { 
  IDatabaseAdapter,
  PostgresAdapter,
  PostgresTranscriptionRepository,
  PostgresFinancialTransactionRepository,
  PostgresFinancialAccountRepository,
  PostgresFinancialGoalRepository
} from '../adapters/output/database';
import {
  GeminiSpeechAdapter,
  GeminiFinanceExtractionAdapter
} from '../adapters/output/services';
import { PinoLoggerAdapter, LoggerIntegration } from '../adapters/output/logging';

// Adapters - Input
import { TelegramAudioHandlerAdapter } from '../adapters/input/telegram';

// SQLite adapter
import { SQLiteAdapter } from '../adapters/output/database/sqlite-adapter';

/**
 * Container class for managing dependencies
 */
export class Container {
  private static instance: Container;
  private knexInstance!: Knex;
  private databaseAdapter!: IDatabaseAdapter;
  private logger!: ILoggerPort;
  private sqliteAdapter!: SQLiteAdapter;

  // Ports/Adapters
  private speechToTextPort!: ISpeechToTextPort;
  private financeExtractionPort!: IFinanceExtractionPort;
  
  // Repositories
  private transcriptionRepository!: ITranscriptionRepository;
  private financialTransactionRepository!: IFinancialTransactionRepository;
  private financialAccountRepository!: IFinancialAccountRepository;
  private financialGoalRepository!: IFinancialGoalRepository;

  // Use Cases
  private transcribeAudioUseCase!: TranscribeAudioUseCase;
  private saveTranscriptionUseCase!: SaveTranscriptionUseCase;
  private extractFinancialDataUseCase!: ExtractFinancialDataUseCase;
  private saveFinancialDataUseCase!: SaveFinancialDataUseCase;
  private getFinancialSummaryUseCase!: GetFinancialSummaryUseCase;

  // Input Adapters
  private telegramAudioHandlerAdapter!: TelegramAudioHandlerAdapter;

  // Telegram Bot
  private telegramBot!: Telegraf;

  private constructor() {
    // Initialize will be called explicitly
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  /**
   * Initialize all dependencies
   */
  public async initialize(config: {
    postgresConnectionString: string;
    geminiApiKey: string;
    telegramBotToken: string;
    environment: 'development' | 'production' | 'test';
  }): Promise<void> {
    // Set up logging first (needed for other components)
    await this.initializeLogging(config.environment);
    
    // Set up database connections
    this.initializeDatabase(config.postgresConnectionString);
    
    // Initialize SQLite adapter
    await this.sqliteAdapter.initialize();
    
    // Set up adapters
    this.initializeAdapters(config.geminiApiKey);
    
    // Set up repositories
    this.initializeRepositories();
    
    // Set up use cases
    this.initializeUseCases();
    
    // Set up input adapters
    this.initializeTelegramBot(config.telegramBotToken);

    this.logger.info('Container initialized successfully');
  }

  /**
   * Initialize database connections
   */
  private initializeDatabase(connectionString: string): void {
    // Initialize PostgresAdapter for database operations
    this.databaseAdapter = new PostgresAdapter(this.logger);
    
    // Get knex instance from the adapter
    this.knexInstance = this.databaseAdapter.getKnex();
    
    // Initialize SQLite for logging
    this.sqliteAdapter = new SQLiteAdapter('logs.db');
  }

  /**
   * Initialize logging
   */
  private async initializeLogging(environment: string): Promise<void> {
    // Initialize the logger using the LoggerIntegration
    const logLevel = environment === 'production' ? 'info' : 'debug';
    this.logger = await LoggerIntegration.initializeDefaultLogger('./logs.db', logLevel);
  }

  /**
   * Initialize adapters for external services
   */
  private initializeAdapters(geminiApiKey: string): void {
    this.speechToTextPort = new GeminiSpeechAdapter(geminiApiKey, this.logger);
    this.financeExtractionPort = new GeminiFinanceExtractionAdapter(geminiApiKey, this.logger);
  }

  /**
   * Initialize repositories
   */
  private initializeRepositories(): void {
    this.transcriptionRepository = new PostgresTranscriptionRepository(this.databaseAdapter);
    this.financialTransactionRepository = new PostgresFinancialTransactionRepository(this.databaseAdapter);
    this.financialAccountRepository = new PostgresFinancialAccountRepository(this.databaseAdapter);
    this.financialGoalRepository = new PostgresFinancialGoalRepository(this.databaseAdapter);
  }

  /**
   * Initialize use cases
   */
  private initializeUseCases(): void {
    // Transcription use cases
    this.transcribeAudioUseCase = new TranscribeAudioUseCase(
      this.speechToTextPort,
      this.logger
    );
    
    this.saveTranscriptionUseCase = new SaveTranscriptionUseCase(
      this.transcriptionRepository,
      this.logger
    );
    
    // Finance use cases
    this.extractFinancialDataUseCase = new ExtractFinancialDataUseCase(
      this.financeExtractionPort,
      this.logger
    );
    
    this.saveFinancialDataUseCase = new SaveFinancialDataUseCase(
      this.financialTransactionRepository,
      this.financialAccountRepository,
      this.financialGoalRepository,
      this.logger
    );
    
    this.getFinancialSummaryUseCase = new GetFinancialSummaryUseCase(
      this.financialTransactionRepository,
      this.financialAccountRepository,
      this.financialGoalRepository,
      this.logger
    );
  }

  /**
   * Initialize Telegram bot and handlers
   */
  private initializeTelegramBot(botToken: string): void {
    this.telegramBot = new Telegraf(botToken);
    
    this.telegramAudioHandlerAdapter = new TelegramAudioHandlerAdapter(
      this.logger,
      this.speechToTextPort,
      this.financeExtractionPort
    );
  }

  // Getters for dependencies

  public getLogger(): ILoggerPort {
    return this.logger;
  }

  public getDatabaseAdapter(): IDatabaseAdapter {
    return this.databaseAdapter;
  }

  public getSpeechToTextPort(): ISpeechToTextPort {
    return this.speechToTextPort;
  }

  public getFinanceExtractionPort(): IFinanceExtractionPort {
    return this.financeExtractionPort;
  }

  public getTranscriptionRepository(): ITranscriptionRepository {
    return this.transcriptionRepository;
  }

  public getFinancialTransactionRepository(): IFinancialTransactionRepository {
    return this.financialTransactionRepository;
  }

  public getFinancialAccountRepository(): IFinancialAccountRepository {
    return this.financialAccountRepository;
  }

  public getFinancialGoalRepository(): IFinancialGoalRepository {
    return this.financialGoalRepository;
  }

  public getTranscribeAudioUseCase(): TranscribeAudioUseCase {
    return this.transcribeAudioUseCase;
  }

  public getSaveTranscriptionUseCase(): SaveTranscriptionUseCase {
    return this.saveTranscriptionUseCase;
  }

  public getExtractFinancialDataUseCase(): ExtractFinancialDataUseCase {
    return this.extractFinancialDataUseCase;
  }

  public getSaveFinancialDataUseCase(): SaveFinancialDataUseCase {
    return this.saveFinancialDataUseCase;
  }

  public getGetFinancialSummaryUseCase(): GetFinancialSummaryUseCase {
    return this.getFinancialSummaryUseCase;
  }

  public getTelegramAudioHandlerAdapter(): TelegramAudioHandlerAdapter {
    return this.telegramAudioHandlerAdapter;
  }

  public getTelegramBot(): Telegraf {
    return this.telegramBot;
  }
}