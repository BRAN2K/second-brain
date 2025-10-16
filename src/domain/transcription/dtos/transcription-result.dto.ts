/**
 * TranscriptionResultDTO
 * 
 * Data transfer object for transcription results
 */

import { Transcription } from '../entities';

export interface TranscriptionResultDTO {
  /** The raw transcribed text */
  text: string;
  
  /** File ID of the audio that was transcribed */
  fileId: string;
  
  /** Metadata about the transcription process */
  metadata: {
    /** Duration of audio in seconds */
    duration?: number;
    
    /** Format of the audio file */
    format?: string;
    
    /** Timestamp when the transcription was completed */
    timestamp: Date;
    
    /** Additional metadata */
    [key: string]: any;
  };
}