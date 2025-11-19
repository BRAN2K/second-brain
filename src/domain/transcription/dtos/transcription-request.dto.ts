/**
 * TranscriptionRequestDTO
 * 
 * Data transfer object for requesting audio transcription
 */

import { AudioFile } from '../entities/audio-file.entity';

export interface TranscriptionRequestDTO {
  /** Audio file to transcribe */
  audioFile: AudioFile;
  
  /** User ID requesting the transcription */
  userId: number;
  
  /** Optional username */
  username?: string;
  
  /** Duration of the audio in seconds */
  audioDuration?: number;
  
  /** Timestamp of when the transcription was requested */
  timestamp: Date;
}