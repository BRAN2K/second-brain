/**
 * SaveTranscriptionUseCase
 * 
 * This use case is responsible for saving transcription data to a repository.
 */

import { ITranscriptionRepository } from '../repositories';
import { ILoggerPort } from '../../common/ports';
import { TranscriptionResultDTO } from '../dtos';
import { Transcription } from '../entities';

export class SaveTranscriptionUseCase {
  constructor(
    private transcriptionRepository: ITranscriptionRepository,
    private loggerPort: ILoggerPort
  ) {}

  /**
   * Execute the use case
   * @param transcriptionResult The transcription result to save
   * @returns The saved transcription with its ID
   */
  async execute(transcriptionResult: TranscriptionResultDTO): Promise<Transcription> {
    try {
      this.loggerPort.info('Saving transcription', { 
        textLength: transcriptionResult.text.length,
        fileId: transcriptionResult.fileId
      });
      
      // Create a transcription entity from the DTO
      const transcription = new Transcription(
        transcriptionResult.metadata.userId as number,
        transcriptionResult.text,
        transcriptionResult.metadata.timestamp,
        transcriptionResult.metadata.duration,
        {
          fileId: transcriptionResult.fileId,
          ...transcriptionResult.metadata
        }
      );
      
      // Save the transcription entity
      const savedTranscription = await this.transcriptionRepository.save(
        transcription
      );
      
      this.loggerPort.info('Transcription saved successfully', {
        transcriptionId: savedTranscription.id,
        userId: savedTranscription.userId
      });
      
      return savedTranscription;
    } catch (error) {
      this.loggerPort.error('Error saving transcription', { error });
      throw error;
    }
  }
}