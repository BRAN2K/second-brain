export interface TranscriptionMetadata {
  userId: number;
  username?: string;
  audioDuration?: number;
  fileSize?: number;
  timestamp: Date;
}

export interface TranscriptionLog {
  id?: number;
  userId: number;
  username?: string;
  text: string;
  audioDuration?: number;
  createdAt: Date;
  metadata?: string; // JSON string
}

export interface AudioFile {
  fileId: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
}


