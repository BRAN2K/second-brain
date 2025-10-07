import pino from 'pino';
import { ILogger } from './ILogger';
import { TranscriptionLog } from '../../types';
import { SqliteService } from '../database/sqliteService';

export class PinoLogger implements ILogger {
  private logger: pino.Logger;
  private sqliteService: SqliteService;

  constructor(sqliteService: SqliteService, logLevel: string = 'info') {
    this.sqliteService = sqliteService;
    
    // Configuração do Pino com fallback para console simples
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    this.logger = pino({
      level: logLevel,
      ...(isDevelopment && {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname'
          }
        }
      })
    });
  }

  async logTranscription(log: TranscriptionLog): Promise<void> {
    // Log no console com Pino
    this.logger.info({
      type: 'transcription',
      userId: log.userId,
      username: log.username,
      text: log.text,
      audioDuration: log.audioDuration,
      timestamp: log.createdAt.toISOString()
    }, 'Transcrição realizada');

    // Salvar no banco de dados
    try {
      await this.sqliteService.insertTranscriptionLog(log);
    } catch (error) {
      this.error('Erro ao salvar transcrição no banco de dados', error as Error);
    }
  }

  info(message: string, data?: any): void {
    this.logger.info(data, message);
  }

  error(message: string, error?: Error): void {
    this.logger.error({ error: error?.message, stack: error?.stack }, message);
  }

  warn(message: string, data?: any): void {
    this.logger.warn(data, message);
  }
}
