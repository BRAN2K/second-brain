/**
 * ITranscriptionRepository
 * 
 * Repository interface for Transcription entity operations
 */
import { Transcription } from '../entities';

export interface ITranscriptionRepository {
  /**
   * Save a new transcription
   * @param transcription The transcription to save
   * @returns The saved transcription with ID
   */
  save(transcription: Transcription): Promise<Transcription>;

  /**
   * Find a transcription by its ID
   * @param id The transcription ID
   * @returns The transcription if found, or null
   */
  findById(id: number): Promise<Transcription | null>;

  /**
   * Find transcriptions by user ID
   * @param userId The user ID
   * @param limit Maximum number of records to return
   * @returns Array of transcriptions
   */
  findByUserId(userId: number, limit?: number): Promise<Transcription[]>;
  
  /**
   * Find recent transcriptions
   * @param limit Maximum number of records to return
   * @returns Array of recent transcriptions
   */
  findRecent(limit?: number): Promise<Transcription[]>;
  
  /**
   * Update an existing transcription
   * @param transcription The transcription to update
   * @returns The updated transcription
   */
  update(transcription: Transcription): Promise<Transcription>;
  
  /**
   * Delete a transcription by ID
   * @param id The transcription ID to delete
   * @returns True if deleted, false otherwise
   */
  delete(id: number): Promise<boolean>;
}