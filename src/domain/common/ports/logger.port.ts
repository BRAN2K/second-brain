/**
 * ILoggerPort
 * 
 * Port interface for logging functionality.
 * Implementations will handle the actual logging mechanism.
 */

export interface ILoggerPort {
  /**
   * Log an info message
   * @param message Message to log
   * @param data Additional data to log
   */
  info(message: string, data?: any): void;
  
  /**
   * Log an error message
   * @param message Error message to log
   * @param error Error object or details
   */
  error(message: string, error?: any): void;
  
  /**
   * Log a warning message
   * @param message Warning message to log
   * @param data Additional data to log
   */
  warn(message: string, data?: any): void;
  
  /**
   * Log a debug message
   * @param message Debug message to log
   * @param data Additional data to log
   */
  debug(message: string, data?: any): void;
}