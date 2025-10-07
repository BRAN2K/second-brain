import sqlite3 from 'sqlite3';
import { TranscriptionLog } from '../../types';

export class SqliteService {
  private db: sqlite3.Database;

  constructor(databasePath: string) {
    this.db = new sqlite3.Database(databasePath);
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS transcription_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        username TEXT,
        text TEXT NOT NULL,
        audio_duration REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT
      )
    `;

    this.db.exec(createTableQuery);
  }

  async insertTranscriptionLog(log: TranscriptionLog): Promise<void> {
    return new Promise((resolve, reject) => {
      const insertQuery = `
        INSERT INTO transcription_logs (user_id, username, text, audio_duration, created_at, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        insertQuery,
        [
          log.userId,
          log.username || null,
          log.text,
          log.audioDuration || null,
          log.createdAt.toISOString(),
          log.metadata || null
        ],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async getTranscriptionLogs(userId?: number, limit: number = 100): Promise<TranscriptionLog[]> {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM transcription_logs';
      const params: any[] = [];

      if (userId) {
        query += ' WHERE user_id = ?';
        params.push(userId);
      }

      query += ' ORDER BY created_at DESC LIMIT ?';
      params.push(limit);

      this.db.all(query, params, (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const logs = rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            username: row.username,
            text: row.text,
            audioDuration: row.audio_duration,
            createdAt: new Date(row.created_at),
            metadata: row.metadata
          }));
          resolve(logs);
        }
      });
    });
  }

  close(): void {
    this.db.close();
  }
}
