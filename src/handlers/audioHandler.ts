import { Context } from 'telegraf';
import axios from 'axios';
import { ISpeechToText } from '../services/speechToText/ISpeechToText';
import { ILogger } from '../services/logging/ILogger';
import { TranscriptionMetadata, TranscriptionLog } from '../types';

export class AudioHandler {
  constructor(
    private speechToTextService: ISpeechToText,
    private logger: ILogger
  ) {}

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

      await this.logger.logTranscription(transcriptionLog);

      await ctx.reply(`📝 **Transcrição:**\n\n${transcribedText}`, {
        parse_mode: 'Markdown'
      });

    } catch (error) {
      this.logger.error('Erro ao processar áudio', error as Error);
      await ctx.reply('❌ Ocorreu um erro ao processar o áudio. Tente novamente.');
    }
  }
}
