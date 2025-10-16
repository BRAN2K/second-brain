/**
 * Logger integration
 * 
 * Provides a way to integrate with an external logger implementation.
 * This serves as a connector that allows setting an external logger
 * that implements the ILoggerPort interface.
 */

import { ILoggerPort } from '../../../domain/common/ports/logger.port';
import { PinoLoggerAdapter } from './pino-logger.adapter';
import { SQLiteAdapter } from '../database/sqlite-adapter';

export class LoggerIntegration {
  private static logger: ILoggerPort | null = null;

  /**
   * Set the logger instance to be used globally
   * @param logger An implementation of ILoggerPort
   */
  public static setLogger(logger: ILoggerPort): void {
    LoggerIntegration.logger = logger;
  }

  /**
   * Get the logger instance
   * @returns The logger instance or null if not set
   */
  public static getLogger(): ILoggerPort | null {
    return LoggerIntegration.logger;
  }

  /**
   * Check if a logger is set
   * @returns True if a logger is set, false otherwise
   */
  public static hasLogger(): boolean {
    return LoggerIntegration.logger !== null;
  }

  /**
   * Initialize a default logger if none is set
   * @param dbPath Path to SQLite database for logging
   * @param logLevel Log level
   */
  public static async initializeDefaultLogger(
    dbPath: string = './logs.db',
    logLevel: string = 'info'
  ): Promise<ILoggerPort> {
    // Set up SQLite adapter for logging
    const sqliteAdapter = new SQLiteAdapter(dbPath);
    await sqliteAdapter.initialize();

    // Create a simple console logger as a fallback
    const fallbackLogger: ILoggerPort = {
      info: (message: string, data?: any) => console.info(`[INFO] ${message}`, data || ''),
      error: (message: string, error?: any) => console.error(`[ERROR] ${message}`, error || ''),
      warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data || ''),
      debug: (message: string, data?: any) => console.debug(`[DEBUG] ${message}`, data || '')
    };
    
    // Set as global logger
    LoggerIntegration.setLogger(fallbackLogger);
    
    return fallbackLogger;
  }
} 