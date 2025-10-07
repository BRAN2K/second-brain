import { TranscriptionMetadata } from '../../types';

export interface ISpeechToText {
  /**
   * Converte um buffer de áudio em texto
   * @param audioBuffer Buffer contendo os dados do áudio
   * @param metadata Metadados da transcrição
   * @returns Promise com o texto transcrito
   */
  transcribe(audioBuffer: Buffer, metadata: TranscriptionMetadata): Promise<string>;
}


