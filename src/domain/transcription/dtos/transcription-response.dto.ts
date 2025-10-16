/**
 * TranscriptionResponseDTO
 * 
 * Data transfer object for transcription response.
 */
import { TranscriptionResultDTO } from './transcription-result.dto';

export interface TranscriptionResponseDTO {
  /** The transcription result */
  result: TranscriptionResultDTO;
  
  /** Status of the transcription */
  status: 'success' | 'partial' | 'failed';
  
  /** Processing time in milliseconds */
  processingTime?: number;
  
  /** Any error message if status is 'failed' or 'partial' */
  errorMessage?: string;
  
  /** Timestamp when the transcription was completed */
  timestamp: Date;
}