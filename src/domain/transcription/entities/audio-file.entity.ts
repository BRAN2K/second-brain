/**
 * AudioFile entity
 * 
 * Represents the audio file that is processed for transcription.
 */
export class AudioFile {
  private _fileId: string;
  private _filePath: string;
  private _mimeType: string;
  private _fileSize: number;

  constructor(
    fileId: string,
    filePath: string,
    mimeType: string,
    fileSize: number
  ) {
    this.validateFileId(fileId);
    this.validateFilePath(filePath);
    this.validateFileSize(fileSize);
    
    this._fileId = fileId;
    this._filePath = filePath;
    this._mimeType = mimeType;
    this._fileSize = fileSize;
  }

  /**
   * Validates that the fileId is not empty
   */
  private validateFileId(fileId: string): void {
    if (!fileId || fileId.trim().length === 0) {
      throw new Error('File ID cannot be empty');
    }
  }

  /**
   * Validates that the filePath is not empty
   */
  private validateFilePath(filePath: string): void {
    if (!filePath || filePath.trim().length === 0) {
      throw new Error('File path cannot be empty');
    }
  }

  /**
   * Validates that the fileSize is positive
   */
  private validateFileSize(fileSize: number): void {
    if (fileSize <= 0) {
      throw new Error('File size must be greater than 0');
    }
  }

  // Getters
  get fileId(): string {
    return this._fileId;
  }

  get filePath(): string {
    return this._filePath;
  }

  get mimeType(): string {
    return this._mimeType;
  }

  get fileSize(): number {
    return this._fileSize;
  }

  // Domain methods

  /**
   * Gets the file extension based on the mimetype
   */
  getFileExtension(): string {
    const mimeToExtension: Record<string, string> = {
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/wav': 'wav',
      'audio/ogg': 'ogg',
      'audio/flac': 'flac',
      'audio/aac': 'aac'
    };
    
    return mimeToExtension[this._mimeType] || 'unknown';
  }

  /**
   * Checks if the file is of a supported audio format
   */
  isSupportedFormat(): boolean {
    const supportedTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/flac',
      'audio/aac'
    ];
    
    return supportedTypes.includes(this._mimeType);
  }

  /**
   * Checks if the file size is within the allowed limit (e.g., 20MB)
   */
  isWithinSizeLimit(limitInBytes: number = 20 * 1024 * 1024): boolean {
    return this._fileSize <= limitInBytes;
  }

  /**
   * Creates a JSON representation of the audio file
   */
  toJSON(): Record<string, any> {
    return {
      fileId: this._fileId,
      filePath: this._filePath,
      mimeType: this._mimeType,
      fileSize: this._fileSize,
      extension: this.getFileExtension()
    };
  }
}