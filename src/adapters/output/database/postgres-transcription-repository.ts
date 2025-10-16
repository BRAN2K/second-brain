/**
 * PostgresTranscriptionRepository
 * 
 * Implements the ITranscriptionRepository interface using PostgreSQL database.
 */
import { Knex } from 'knex';
import { Transcription } from '../../../domain/transcription/entities';
import { ITranscriptionRepository } from '../../../domain/transcription/repositories';
import { IDatabaseAdapter } from './database-adapter.interface';
import { PostgresAdapter } from './postgres-adapter';

export class PostgresTranscriptionRepository implements ITranscriptionRepository {
  private knex: Knex;
  private readonly tableName = 'transcription_logs';

  constructor(databaseAdapter?: IDatabaseAdapter) {
    if (databaseAdapter) {
      this.knex = databaseAdapter.getKnex();
    } else {
      const postgresAdapter = new PostgresAdapter();
      this.knex = postgresAdapter.getKnex();
    }
  }

  /**
   * Save a transcription to the database
   */
  async save(transcription: Transcription): Promise<Transcription> {
    try {
      const [result] = await this.knex(this.tableName)
        .insert({
          user_id: transcription.userId,
          username: transcription.metadata?.username || null,
          text: transcription.text,
          audio_duration: transcription.audioDuration || null,
          created_at: transcription.createdAt,
          metadata: transcription.metadata ? JSON.stringify(transcription.metadata) : null
        })
        .returning('*');
      
      // Map DB record to domain entity
      return new Transcription(
        result.user_id,
        result.text,
        new Date(result.created_at),
        result.audio_duration,
        result.metadata ? JSON.parse(result.metadata) : undefined,
        result.id
      );
    } catch (error) {
      throw new Error(`Failed to save transcription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find a transcription by its ID
   */
  async findById(id: number): Promise<Transcription | null> {
    try {
      const result = await this.knex(this.tableName)
        .where('id', id)
        .first();
      
      if (!result) {
        return null;
      }
      
      // Map DB record to domain entity
      return new Transcription(
        result.user_id,
        result.text,
        new Date(result.created_at),
        result.audio_duration,
        result.metadata ? JSON.parse(result.metadata) : undefined,
        result.id
      );
    } catch (error) {
      throw new Error(`Failed to find transcription by ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find transcriptions by user ID
   */
  async findByUserId(userId: number, limit: number = 100): Promise<Transcription[]> {
    try {
      const results = await this.knex(this.tableName)
        .where('user_id', userId)
        .orderBy('created_at', 'desc')
        .limit(limit);
      
      // Map DB records to domain entities
      return results.map(result => new Transcription(
        result.user_id,
        result.text,
        new Date(result.created_at),
        result.audio_duration,
        result.metadata ? JSON.parse(result.metadata) : undefined,
        result.id
      ));
    } catch (error) {
      throw new Error(`Failed to find transcriptions by user ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find recent transcriptions
   */
  async findRecent(limit: number = 100): Promise<Transcription[]> {
    try {
      const results = await this.knex(this.tableName)
        .orderBy('created_at', 'desc')
        .limit(limit);
      
      // Map DB records to domain entities
      return results.map(result => new Transcription(
        result.user_id,
        result.text,
        new Date(result.created_at),
        result.audio_duration,
        result.metadata ? JSON.parse(result.metadata) : undefined,
        result.id
      ));
    } catch (error) {
      throw new Error(`Failed to find recent transcriptions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a transcription
   */
  async update(transcription: Transcription): Promise<Transcription> {
    try {
      if (!transcription.id) {
        throw new Error('Cannot update transcription without ID');
      }
      
      const [result] = await this.knex(this.tableName)
        .where('id', transcription.id)
        .update({
          user_id: transcription.userId,
          text: transcription.text,
          audio_duration: transcription.audioDuration || null,
          metadata: transcription.metadata ? JSON.stringify(transcription.metadata) : null
        })
        .returning('*');
      
      if (!result) {
        throw new Error(`Transcription with ID ${transcription.id} not found`);
      }
      
      // Map DB record to domain entity
      return new Transcription(
        result.user_id,
        result.text,
        new Date(result.created_at),
        result.audio_duration,
        result.metadata ? JSON.parse(result.metadata) : undefined,
        result.id
      );
    } catch (error) {
      throw new Error(`Failed to update transcription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a transcription by ID
   */
  async delete(id: number): Promise<boolean> {
    try {
      const deleted = await this.knex(this.tableName)
        .where('id', id)
        .delete();
      
      return deleted > 0;
    } catch (error) {
      throw new Error(`Failed to delete transcription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}