import { TranscriptionLog } from '../../types';

export interface ILogger {
  /**
   * Loga uma transcrição no console e banco de dados
   * @param log Dados da transcrição para logar
   */
  logTranscription(log: TranscriptionLog): Promise<void>;

  /**
   * Log de informação
   * @param message Mensagem a ser logada
   * @param data Dados adicionais opcionais
   */
  info(message: string, data?: any): void;

  /**
   * Log de erro
   * @param message Mensagem de erro
   * @param error Objeto de erro opcional
   */
  error(message: string, error?: Error): void;

  /**
   * Log de warning
   * @param message Mensagem de warning
   * @param data Dados adicionais opcionais
   */
  warn(message: string, data?: any): void;
}


