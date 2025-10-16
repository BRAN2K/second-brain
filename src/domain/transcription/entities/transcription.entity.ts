/**
 * Transcription entity
 * 
 * Represents the core domain entity for an audio transcription.
 */
export class Transcription {
  private _id?: number;
  private _userId: number;
  private _text: string;
  private _audioDuration?: number;
  private _createdAt: Date;
  private _metadata?: Record<string, any>;

  constructor(
    userId: number,
    text: string,
    createdAt: Date = new Date(),
    audioDuration?: number,
    metadata?: Record<string, any>,
    id?: number
  ) {
    this.validateText(text);
    this.validateUserId(userId);
    
    this._id = id;
    this._userId = userId;
    this._text = text;
    this._audioDuration = audioDuration;
    this._createdAt = createdAt;
    this._metadata = metadata;
  }

  /**
   * Validates that the text is not empty
   */
  private validateText(text: string): void {
    if (!text || text.trim().length === 0) {
      throw new Error('Transcription text cannot be empty');
    }
  }

  /**
   * Validates that the userId is valid
   */
  private validateUserId(userId: number): void {
    if (!userId || userId <= 0) {
      throw new Error('User ID must be a positive number');
    }
  }

  // Getters
  get id(): number | undefined {
    return this._id;
  }

  get userId(): number {
    return this._userId;
  }

  get text(): string {
    return this._text;
  }

  get audioDuration(): number | undefined {
    return this._audioDuration;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get metadata(): Record<string, any> | undefined {
    return this._metadata ? { ...this._metadata } : undefined;
  }

  // Domain methods

  /**
   * Checks if this transcription is recent (less than 24 hours old)
   */
  isRecent(): boolean {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    return this._createdAt > twentyFourHoursAgo;
  }

  /**
   * Calculates the word count of the transcription
   */
  getWordCount(): number {
    return this._text.trim().split(/\s+/).length;
  }

  /**
   * Creates a summary of the transcription (first 100 characters)
   */
  getSummary(maxLength: number = 100): string {
    if (this._text.length <= maxLength) {
      return this._text;
    }
    return `${this._text.substring(0, maxLength)}...`;
  }

  /**
   * Creates a JSON representation of the transcription
   */
  toJSON(): Record<string, any> {
    return {
      id: this._id,
      userId: this._userId,
      text: this._text,
      audioDuration: this._audioDuration,
      createdAt: this._createdAt,
      metadata: this._metadata
    };
  }
}