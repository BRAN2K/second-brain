import { Context } from 'telegraf';
import axios from 'axios';
import { ISpeechToText } from '../services/speechToText/ISpeechToText';
import { ILogger } from '../services/logging/ILogger';
import { TranscriptionMetadata, TranscriptionLog } from '../types';
import { FinanceExtractionService } from '../services/finance/financeExtractionService';
import { PostgresService } from '../services/database/postgresService';
import { FinanceExtractionMetadata } from '../types/finance';

export class AudioHandler {
  private financeExtractionService: FinanceExtractionService;
  private postgresService: PostgresService;

  constructor(
    private speechToTextService: ISpeechToText,
    private logger: ILogger,
    geminiApiKey: string
  ) {
    this.financeExtractionService = new FinanceExtractionService(geminiApiKey);
    this.postgresService = new PostgresService();
  }

  async handleAudio(ctx: Context): Promise<void> {
    try {
      const message = ctx.message;
      if (!message || (!('voice' in message) && !('audio' in message))) {
        await ctx.reply('Por favor, envie um arquivo de áudio ou uma mensagem de voz.');
        return;
      }

      const audio = 'voice' in message ? message.voice : message.audio;
      if (!audio) {
        await ctx.reply('Erro ao processar o áudio.');
        return;
      }

      const maxFileSize = 20 * 1024 * 1024;
      if (audio.file_size && audio.file_size > maxFileSize) {
        await ctx.reply('O arquivo de áudio é muito grande. Por favor, envie um arquivo menor que 20MB.');
        return;
      }

      await ctx.reply('🎵 Processando áudio...');

      const file = await ctx.telegram.getFile(audio.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${ctx.telegram.token}/${file.file_path}`;

      const response = await axios.get(fileUrl, {
        responseType: 'arraybuffer'
      });

      const audioBuffer = Buffer.from(response.data);

      const metadata: TranscriptionMetadata = {
        userId: ctx.from?.id || 0,
        username: ctx.from?.username,
        audioDuration: audio.duration,
        fileSize: audio.file_size,
        timestamp: new Date()
      };

      const transcribedText = await this.speechToTextService.transcribe(audioBuffer, metadata);

      if (!transcribedText || transcribedText.trim().length === 0) {
        await ctx.reply('Não foi possível transcrever o áudio. Tente novamente.');
        return;
      }

      const transcriptionLog: TranscriptionLog = {
        userId: metadata.userId,
        username: metadata.username,
        text: transcribedText,
        audioDuration: metadata.audioDuration,
        createdAt: metadata.timestamp,
        metadata: JSON.stringify({
          fileSize: metadata.fileSize,
          fileId: audio.file_id
        })
      };

      // Salvar log de transcrição no PostgreSQL
      await this.postgresService.insertTranscriptionLog(transcriptionLog);
      
      // Também salvar no sistema de logs antigo (para compatibilidade)
      await this.logger.logTranscription(transcriptionLog);

      // Extrair dados financeiros do texto transcrito
      const financeMetadata: FinanceExtractionMetadata = {
        userId: metadata.userId,
        username: metadata.username,
        audioDuration: metadata.audioDuration,
        transcriptionText: transcribedText,
        timestamp: metadata.timestamp
      };

      const extractedFinancialData = await this.financeExtractionService.extractFinancialData(
        transcribedText, 
        financeMetadata
      );

      // Salvar dados financeiros extraídos
      if (extractedFinancialData.confidence > 0.3) { // Só salvar se confiança > 30%
        try {
          const savedData = await this.postgresService.insertExtractedFinancialData(
            metadata.userId,
            extractedFinancialData
          );

          // Salvar log da extração
          await this.postgresService.insertFinanceExtractionLog(
            metadata.userId,
            transcribedText,
            extractedFinancialData
          );

          // Preparar resposta com dados financeiros
          let responseText = `📝 **Transcrição:**\n\n${transcribedText}\n\n`;
          
          if (extractedFinancialData.transactions.length > 0) {
            responseText += `💰 **Transações identificadas:**\n`;
            extractedFinancialData.transactions.forEach((transaction, index) => {
              const typeEmoji = transaction.type === 'income' ? '📈' : 
                               transaction.type === 'expense' ? '📉' : '🔄';
              responseText += `${typeEmoji} ${transaction.description} - R$ ${transaction.amount}\n`;
            });
            responseText += `\n`;
          }

          if (extractedFinancialData.accounts.length > 0) {
            responseText += `🏦 **Contas mencionadas:**\n`;
            extractedFinancialData.accounts.forEach(account => {
              responseText += `• ${account.name} (${account.type})\n`;
            });
            responseText += `\n`;
          }

          if (extractedFinancialData.goals.length > 0) {
            responseText += `🎯 **Metas identificadas:**\n`;
            extractedFinancialData.goals.forEach(goal => {
              responseText += `• ${goal.title} - R$ ${goal.targetAmount}\n`;
            });
            responseText += `\n`;
          }

          if (extractedFinancialData.notes.length > 0) {
            responseText += `📋 **Observações:**\n`;
            extractedFinancialData.notes.forEach(note => {
              responseText += `• ${note}\n`;
            });
            responseText += `\n`;
          }

          responseText += `🔍 **Confiança na extração:** ${Math.round(extractedFinancialData.confidence * 100)}%`;

          await ctx.reply(responseText, { parse_mode: 'Markdown' });

        } catch (error) {
          this.logger.error('Erro ao salvar dados financeiros', error as Error);
          
          // Se der erro, pelo menos mostrar a transcrição
          await ctx.reply(`📝 **Transcrição:**\n\n${transcribedText}`, {
            parse_mode: 'Markdown'
          });
        }
      } else {
        // Se confiança baixa, mostrar apenas transcrição
        await ctx.reply(`📝 **Transcrição:**\n\n${transcribedText}`, {
          parse_mode: 'Markdown'
        });
      }

    } catch (error) {
      this.logger.error('Erro ao processar áudio', error as Error);
      await ctx.reply('❌ Ocorreu um erro ao processar o áudio. Tente novamente.');
    }
  }
}
