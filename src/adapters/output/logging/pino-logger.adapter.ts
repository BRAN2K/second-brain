/**
 * Console Logger Adapter
 * 
 * Implements the ILoggerPort interface using Console logging.
 * This is a simplified adapter that replaced the old PinoLogger adapter.
 */
import { ILoggerPort } from '../../../domain/common/ports/logger.port';
import { TranscriptionLog } from '../../../types';

export class PinoLoggerAdapter implements ILoggerPort {
  /**
   * Log a transcription
   */
  async logTranscription(log: TranscriptionLog): Promise<void> {
    console.info(`[TRANSCRIPTION] User ${log.userId} (${log.username || 'unknown'}) - ${log.text}`);
    
    // No database logging in this simplified version
    // We rely on the SQLiteAdapter directly for database logging
  }

  /**
   * Log an info message
   */
  info(message: string, data?: any): void {
    if (data) {
      console.info(`[INFO] ${message}`, data);
    } else {
      console.info(`[INFO] ${message}`);
    }
  }

  /**
   * Log an error message
   */
  error(message: string, error?: any): void {
    if (error instanceof Error) {
      console.error(`[ERROR] ${message}`, error.message, error.stack);
    } else if (error) {
      console.error(`[ERROR] ${message}`, error);
    } else {
      console.error(`[ERROR] ${message}`);
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, data?: any): void {
    if (data) {
      console.warn(`[WARN] ${message}`, data);
    } else {
      console.warn(`[WARN] ${message}`);
    }
  }

  /**
   * Log a debug message
   */
  debug(message: string, data?: any): void {
    if (data) {
      console.debug(`[DEBUG] ${message}`, data);
    } else {
      console.debug(`[DEBUG] ${message}`);
    }
  }
}