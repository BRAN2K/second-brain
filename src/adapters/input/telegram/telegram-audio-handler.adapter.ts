/**
 * Telegram Audio Handler Adapter
 * 
 * Adapter for handling audio messages from Telegram.
 * It connects the Telegram bot interface with the application core.
 */
import { Context } from 'telegraf';
import { Message, Update } from 'telegraf/typings/core/types/typegram';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

import { ILoggerPort } from '~/domain/common/ports/logger.port';
import { ISpeechToTextPort } from '~/domain/transcription/ports/speech-to-text.port';
import { IFinanceExtractionPort } from '~/domain/finance/ports/finance-extraction.port';
import { TranscriptionRequestDTO } from '~/domain/transcription/dtos/transcription-request.dto';
import { TranscribeAudioUseCase } from '~/domain/transcription/use-cases/transcribe-audio.use-case';
import { FinanceExtractionRequestDTO } from '~/domain/finance/dtos';
import { ExtractFinancialDataUseCase } from '~/domain/finance/use-cases/extract-financial-data.use-case';
import { AudioFile } from '~/domain/transcription/entities/audio-file.entity';

export class TelegramAudioHandlerAdapter {
  private logger: ILoggerPort;
  private speechToTextPort: ISpeechToTextPort;
  private financeExtractionPort: IFinanceExtractionPort;
  private transcribeAudioUseCase: TranscribeAudioUseCase;
  private extractFinancialDataUseCase: ExtractFinancialDataUseCase;

  constructor(
    logger: ILoggerPort,
    speechToTextPort: ISpeechToTextPort,
    financeExtractionPort: IFinanceExtractionPort
  ) {
    this.logger = logger;
    this.speechToTextPort = speechToTextPort;
    this.financeExtractionPort = financeExtractionPort;
    
    // Initialize use cases
    this.transcribeAudioUseCase = new TranscribeAudioUseCase(
      this.speechToTextPort,
      this.logger
    );
    
    this.extractFinancialDataUseCase = new ExtractFinancialDataUseCase(
      this.financeExtractionPort,
      this.logger
    );
  }

  /**
   * Handle audio messages from Telegram
   */
  async handleAudio(ctx: Context): Promise<void> {
    try {
      await ctx.reply('🔄 Processando seu áudio...');
      
      const message = ctx.message as Message.AudioMessage | Message.VoiceMessage;
      const userId = message.from?.id || 0;
      const username = message.from?.username || 'unknown';
      
      let fileId: string;
      let duration: number | undefined;
      
      // Extract file ID and duration based on message type
      if ('audio' in message) {
        fileId = message.audio.file_id;
        duration = message.audio.duration;
      } else if ('voice' in message) {
        fileId = message.voice.file_id;
        duration = message.voice.duration;
      } else {
        throw new Error('Unsupported audio format');
      }
      
      // Log received audio
      this.logger.info('Audio received', {
        userId,
        username,
        fileId,
        duration
      });
      
      // Get file link from Telegram
      const fileLink = await ctx.telegram.getFileLink(fileId);
      
      // Download the file
      const tempDir = path.join(__dirname, '../../../../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const audioFilePath = path.join(tempDir, `audio_${userId}_${Date.now()}.ogg`);
      await this.downloadFile(fileLink.href, audioFilePath);
      
      // Process transcription
      await ctx.reply('🎯 Transcrevendo áudio...');
      
      // Create audio file entity
      const audioFile = new AudioFile(
        `telegram_${userId}_${Date.now()}`,  // fileId
        audioFilePath,                       // filePath
        'audio/ogg',                         // mimeType
        fs.statSync(audioFilePath).size      // fileSize
      );
      
      // Create transcription request
      const transcriptionRequest: TranscriptionRequestDTO = {
        audioFile,
        userId: Number(userId),
        username,
        audioDuration: duration || 0,
        timestamp: new Date()
      };
      
      const transcription = await this.transcribeAudioUseCase.execute(transcriptionRequest);
      
      // Extract financial data
      await ctx.reply('💰 Extraindo informações financeiras...');
      
      // Create extraction request
      const extractionRequest: FinanceExtractionRequestDTO = {
        userId: Number(userId),
        username,
        transcriptionText: transcription.text,
        audioDuration: duration || 0,
        timestamp: new Date()
      };
      
      const financeData = await this.extractFinancialDataUseCase.execute(extractionRequest);

      // Send processed result
      await this.sendProcessedResult(ctx, transcription.text, financeData, duration);
      
      // Clean up temporary file
      fs.unlinkSync(audioFilePath);
      
      // Log successful processing
      this.logger.info('Audio processed successfully', {
        userId,
        username,
        transcriptionLength: transcription.text.length,
        financialDataExtracted: !!financeData
      });
    } catch (error) {
      this.logger.error('Error processing audio', error instanceof Error ? error : new Error(String(error)));
      await ctx.reply('❌ Ocorreu um erro ao processar seu áudio. Por favor, tente novamente.');
    }
  }

  /**
   * Download a file from a URL to a local path
   */
  private async downloadFile(url: string, outputPath: string): Promise<void> {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });
    
    return new Promise<void>((resolve, reject) => {
      const writer = fs.createWriteStream(outputPath);
      response.data.pipe(writer);
      
      writer.on('finish', () => {
        writer.close();
        resolve();
      });
      
      writer.on('error', reject);
    });
  }

  /**
   * Format and send the processed result to the user
   */
  private async sendProcessedResult(
    ctx: Context, 
    transcription: string, 
    financeData: any, 
    duration?: number
  ): Promise<void> {
    // Build response message
    let response = `📝 **Transcrição:**\n${transcription}\n\n`;
    
    if (financeData && Object.keys(financeData).length > 0) {
      // Add transactions
      if (financeData.transactions && financeData.transactions.length > 0) {
        response += `💰 **Transações identificadas:**\n`;
        
        for (const transaction of financeData.transactions) {
          const emoji = transaction.type === 'income' ? '📈' : 
                      transaction.type === 'expense' ? '📉' : '🔄';
          
          response += `${emoji} ${transaction.description} - R$ ${transaction.amount}\n`;
        }
        
        response += '\n';
      }
      
      // Add accounts
      if (financeData.accounts && financeData.accounts.length > 0) {
        response += `🏦 **Contas mencionadas:**\n`;
        
        for (const account of financeData.accounts) {
          response += `- ${account.name} (${account.type})\n`;
        }
        
        response += '\n';
      }
      
      // Add goals
      if (financeData.goals && financeData.goals.length > 0) {
        response += `🎯 **Metas financeiras:**\n`;
        
        for (const goal of financeData.goals) {
          response += `- ${goal.title}: R$ ${goal.targetAmount}\n`;
        }
        
        response += '\n';
      }
      
      // Add confidence level
      if (financeData.confidence !== undefined) {
        const confidencePercent = Math.round(financeData.confidence * 100);
        response += `🔍 **Confiança na extração:** ${confidencePercent}%\n`;
      }
    } else {
      response += `ℹ️ Não foram identificadas informações financeiras neste áudio.`;
    }
    
    // Send response
    await ctx.reply(response, { parse_mode: 'Markdown' });
  }
}