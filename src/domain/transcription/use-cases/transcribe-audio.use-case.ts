/**
 * TranscribeAudioUseCase
 * 
 * This use case is responsible for transcribing audio to text.
 */

import { ISpeechToTextPort } from '../ports';
import { ILoggerPort } from '../../common/ports';
import { AudioFile, Transcription } from '../entities';
import { TranscriptionRequestDTO, TranscriptionResultDTO } from '../dtos';
import axios from 'axios';

export class TranscribeAudioUseCase {
  constructor(
    private speechToTextPort: ISpeechToTextPort,
    private loggerPort: ILoggerPort
  ) {}

  /**
   * Execute the use case
   * @param request Contains the audio file and metadata needed for transcription
   * @returns Transcription result
   */
  async execute(request: TranscriptionRequestDTO): Promise<TranscriptionResultDTO> {
    try {
      this.loggerPort.info('Transcribing audio', {
        userId: request.userId,
        fileSize: request.audioFile.fileSize,
        audioDuration: request.audioDuration
      });
      
      // Validate the request
      this.validateRequest(request);
      
      // Get audio buffer from file URL
      const audioBuffer = await this.getAudioBuffer(request.audioFile);
      
      // Use the speech-to-text port to transcribe
      const transcribedText = await this.speechToTextPort.transcribe(
        audioBuffer,
        {
          userId: request.userId,
          username: request.username,
          audioDuration: request.audioDuration,
          fileSize: request.audioFile.fileSize,
          timestamp: request.timestamp
        }
      );
      
      // Create transcription entity
      const transcriptionMetadata = {
        fileId: request.audioFile.fileId,
        mimeType: request.audioFile.mimeType,
        fileSize: request.audioFile.fileSize,
        timestamp: request.timestamp || new Date()
      };
      
      const transcription = new Transcription(
        request.userId,
        transcribedText,
        request.timestamp || new Date(),
        request.audioDuration,
        transcriptionMetadata
      );
      
      this.loggerPort.info('Audio transcription completed', {
        userId: request.userId,
        wordCount: transcription.getWordCount()
      });
      
      // Return the DTO following the expected structure
      return {
        text: transcribedText,
        fileId: request.audioFile.fileId,
        metadata: {
          duration: request.audioDuration,
          format: request.audioFile.mimeType,
          timestamp: request.timestamp || new Date(),
          userId: request.userId,
          username: request.username,
          fileSize: request.audioFile.fileSize
        }
      };
    } catch (error) {
      this.loggerPort.error('Error transcribing audio', { error });
      throw error;
    }
  }

  /**
   * Validates the transcription request
   */
  private validateRequest(request: TranscriptionRequestDTO): void {
    if (!request.audioFile) {
      throw new Error('Audio file is required for transcription');
    }
    
    if (!request.audioFile.isSupportedFormat()) {
      throw new Error(`Unsupported audio format: ${request.audioFile.mimeType}`);
    }
    
    // Check if file is within size limit
    if (!request.audioFile.isWithinSizeLimit()) {
      throw new Error(`Audio file too large: ${request.audioFile.fileSize} bytes`);
    }
  }

  /**
   * Fetches audio buffer from file URL
   */
  private async getAudioBuffer(audioFile: AudioFile): Promise<Buffer> {
    try {
      // If file path is a URL, fetch it
      if (audioFile.filePath.startsWith('http')) {
        const response = await axios.get(audioFile.filePath, {
          responseType: 'arraybuffer'
        });
        
        return Buffer.from(response.data);
      }
      
      // TODO: Implement local file reading if necessary
      throw new Error('Local file reading not yet implemented');
    } catch (error) {
      this.loggerPort.error('Error fetching audio buffer', { error, filePath: audioFile.filePath });
      throw new Error(`Failed to fetch audio file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}