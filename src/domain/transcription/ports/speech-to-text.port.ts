/**
 * ISpeechToTextPort
 * 
 * Port interface for speech-to-text services.
 * This is implemented by adapters that connect to external
 * services like Gemini AI for speech-to-text functionality.
 */

export interface ISpeechToTextPort {
  /**
   * Transcribe audio buffer to text
   * @param audioBuffer Audio data as buffer
   * @param metadata Additional metadata about the audio
   * @returns Transcribed text
   */
  transcribe(
    audioBuffer: Buffer, 
    metadata: {
      userId: number;
      username?: string;
      audioDuration?: number;
      fileSize?: number;
      timestamp: Date;
    }
  ): Promise<string>;
}