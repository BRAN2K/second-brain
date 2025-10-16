/**
 * SQLite Database Adapter
 * 
 * Provides a simple interface to a SQLite database for logging.
 */
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { ILoggerPort } from '../../../domain/common/ports/logger.port';

export class SQLiteAdapter {
  private db: Database | null = null;
  private dbPath: string;
  private logger?: ILoggerPort;
  
  constructor(dbPath: string, logger?: ILoggerPort) {
    this.dbPath = dbPath;
    this.logger = logger;
  }
  
  /**
   * Initialize the database connection
   */
  async initialize(): Promise<void> {
    try {
      // Open the database connection
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      });
      
      // Create logs table if it doesn't exist
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          level TEXT NOT NULL,
          message TEXT NOT NULL,
          metadata TEXT,
          timestamp INTEGER NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS transcription_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          username TEXT,
          text TEXT NOT NULL,
          audio_duration INTEGER,
          metadata TEXT,
          created_at INTEGER NOT NULL
        );
      `);
      
      this.logger?.info('SQLite database initialized successfully');
    } catch (error) {
      this.logger?.error('Error initializing SQLite database', error);
      throw new Error(`Failed to initialize SQLite database: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Save a log entry
   */
  async saveLog(level: string, message: string, metadata?: any): Promise<void> {
    try {
      if (!this.db) {
        await this.initialize();
      }
      
      const timestamp = Date.now();
      const metadataJson = metadata ? JSON.stringify(metadata) : null;
      
      await this.db!.run(
        'INSERT INTO logs (level, message, metadata, timestamp) VALUES (?, ?, ?, ?)',
        level,
        message,
        metadataJson,
        timestamp
      );
    } catch (error) {
      // Don't use logger here to avoid infinite recursion
      console.error('Error saving log to SQLite:', error);
    }
  }
  
  /**
   * Save a transcription log
   */
  async saveTranscriptionLog(
    text: string, 
    userId?: number,
    username?: string,
    audioDuration?: number,
    metadata?: any
  ): Promise<void> {
    try {
      if (!this.db) {
        await this.initialize();
      }
      
      const timestamp = Date.now();
      const metadataJson = metadata ? JSON.stringify(metadata) : null;
      
      await this.db!.run(
        'INSERT INTO transcription_logs (user_id, username, text, audio_duration, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        userId || null,
        username || null,
        text,
        audioDuration || null,
        metadataJson,
        timestamp
      );
      
      this.logger?.info('Transcription log saved successfully');
    } catch (error) {
      this.logger?.error('Error saving transcription log', error);
    }
  }
  
  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.logger?.info('SQLite database connection closed');
    }
  }
}