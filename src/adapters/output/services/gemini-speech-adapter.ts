/**
 * GeminiSpeechAdapter
 * 
 * Implements the ISpeechToTextPort using Gemini AI for speech-to-text.
 */
import fs from 'fs';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ILoggerPort } from '../../../domain/common/ports/logger.port';
import { ISpeechToTextPort } from '../../../domain/transcription/ports';
import { TranscriptionResultDTO } from '../../../domain/transcription/dtos';
import { AudioFile } from '../../../domain/transcription/entities';

export class GeminiSpeechAdapter implements ISpeechToTextPort {
  private model: any;
  private generativeAI: GoogleGenerativeAI;
  private logger?: ILoggerPort;

  constructor(apiKey: string, logger?: ILoggerPort) {
    this.generativeAI = new GoogleGenerativeAI(apiKey);
    this.model = this.generativeAI.getGenerativeModel({ model: "gemini-pro-vision" });
    this.logger = logger;
  }

  /**
   * Transcribes the content of an audio buffer using Gemini model
   * @param audioBuffer Audio data as buffer
   * @param metadata Additional metadata about the audio
   */
  async transcribe(
    audioBuffer: Buffer,
    metadata: {
      userId: number;
      username?: string;
      audioDuration?: number;
      fileSize?: number;
      timestamp: Date;
    }
  ): Promise<string> {
    try {
      this.logger?.info(`Transcribing audio for user ${metadata.userId}`);

      // Convert to a format that the Gemini API accepts
      const audioData = {
        inlineData: {
          data: audioBuffer.toString('base64'),
          mimeType: this.getMimeTypeForAudio(audioBuffer),
        },
      };

      // Create prompt for the model
      const prompt = `
        Transcreva com precisão o conteúdo do áudio fornecido.
        Caso o áudio seja em português, mantenha a transcrição em português.
        Não inclua descrições adicionais, apenas o texto falado.
      `;

      // Call the Gemini API to transcribe the audio
      const result = await this.model.generateContent([prompt, audioData]);
      const response = await result.response;
      const text = response.text();

      this.logger?.info(`Transcription complete: ${text.slice(0, 50)}...`);
      
      // Return just the transcribed text as required by the interface
      return text;
    } catch (error) {
      this.logger?.error('Error transcribing audio:', error);
      throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Determine the MIME type for an audio buffer
   * Since we can't reliably detect type from buffer, we default to ogg
   */
  private getMimeTypeForAudio(audioBuffer: Buffer): string {
    // In a real implementation, we'd use file signatures to detect the format
    // For simplicity, we'll default to ogg since Telegram often uses this format
    return 'audio/ogg';
  }
}