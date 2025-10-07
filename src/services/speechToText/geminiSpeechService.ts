import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { ISpeechToText } from './ISpeechToText';
import { TranscriptionMetadata } from '../../types';

export class GeminiSpeechService implements ISpeechToText {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  }

  async transcribe(audioBuffer: Buffer, metadata: TranscriptionMetadata): Promise<string> {
    try {
      // Determinar o tipo MIME baseado no buffer ou usar um padrão
      const mimeType = this.detectMimeType(audioBuffer) || 'audio/mpeg';

      // Converter buffer para base64
      const base64Audio = audioBuffer.toString('base64');

      // Criar o prompt para transcrição
      const prompt = "Transcreva este áudio em português brasileiro. Forneça apenas o texto transcrito, sem comentários adicionais.";

      // Gerar conteúdo usando o modelo Gemini
      const result = await this.model.generateContent([
        {
          text: prompt
        },
        {
          inlineData: {
            data: base64Audio,
            mimeType: mimeType
          }
        }
      ]);

      const response = await result.response;
      const transcription = response.text();

      if (!transcription || transcription.trim().length === 0) {
        throw new Error('Transcrição vazia - áudio pode estar inaudível ou muito curto');
      }

      return transcription.trim();

    } catch (error) {
      // Tratamento de erros específicos do Gemini
      if (error instanceof Error) {
        if (error.message.includes('API_KEY_INVALID')) {
          throw new Error('Chave da API Gemini inválida. Verifique se a chave está correta.');
        } else if (error.message.includes('QUOTA_EXCEEDED')) {
          throw new Error('Cota da API Gemini excedida. Verifique seu limite de uso.');
        } else if (error.message.includes('PERMISSION_DENIED')) {
          throw new Error('Permissão negada. Verifique se sua conta tem acesso ao Gemini API.');
        } else if (error.message.includes('INVALID_ARGUMENT')) {
          throw new Error('Argumento inválido. Verifique o formato do áudio ou tamanho do arquivo.');
        }
      }
      
      throw new Error(`Erro na transcrição Gemini: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Detecta o tipo MIME do buffer de áudio
   */
  private detectMimeType(buffer: Buffer): string | null {
    // Verificar assinaturas de arquivo comuns
    if (buffer.length < 4) return null;

    const header = buffer.subarray(0, 4);
    
    // MP3
    if (header[0] === 0xFF && (header[1] & 0xE0) === 0xE0) {
      return 'audio/mpeg';
    }
    
    // WAV
    if (header.toString('ascii') === 'RIFF') {
      return 'audio/wav';
    }
    
    // OGG
    if (header.toString('ascii') === 'OggS') {
      return 'audio/ogg';
    }
    
    // FLAC
    if (header.toString('ascii') === 'fLaC') {
      return 'audio/flac';
    }
    
    // AAC (mais complexo, mas vamos assumir se não for nenhum dos outros)
    return 'audio/aac';
  }

  /**
   * Método adicional para análise avançada do áudio
   */
  async analyzeAudio(audioBuffer: Buffer, prompt: string): Promise<string> {
    try {
      const mimeType = this.detectMimeType(audioBuffer) || 'audio/mpeg';
      const base64Audio = audioBuffer.toString('base64');
      
      const result = await this.model.generateContent([
        {
          text: prompt
        },
        {
          inlineData: {
            data: base64Audio,
            mimeType: mimeType
          }
        }
      ]);

      const response = await result.response;
      return response.text() || 'Nenhuma análise foi gerada';
    } catch (error) {
      throw new Error(`Erro na análise de áudio: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
}
