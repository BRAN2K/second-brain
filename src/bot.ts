import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import dotenv from 'dotenv';
import { SqliteService } from './services/database/sqliteService';
import { PinoLogger } from './services/logging/pinoLogger';
import { GeminiSpeechService } from './services/speechToText/geminiSpeechService';
import { AudioHandler } from './handlers/audioHandler';

// Carregar variáveis de ambiente
dotenv.config();

class TelegramSpeechBot {
  private bot: Telegraf;
  private sqliteService: SqliteService;
  private logger: PinoLogger;
  private speechToTextService: GeminiSpeechService;
  private audioHandler: AudioHandler;

  constructor() {
    this.validateEnvironment();

    this.sqliteService = new SqliteService(process.env.DATABASE_PATH || './logs.db');
    this.logger = new PinoLogger(this.sqliteService, process.env.LOG_LEVEL || 'info');
    this.speechToTextService = new GeminiSpeechService(process.env.GEMINI_API_KEY!);

    this.audioHandler = new AudioHandler(this.speechToTextService, this.logger);

    this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
    this.setupHandlers();
  }

  private validateEnvironment(): void {
    const requiredEnvVars = ['TELEGRAM_BOT_TOKEN', 'GEMINI_API_KEY'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(`Variáveis de ambiente obrigatórias não encontradas: ${missingVars.join(', ')}`);
    }
  }

  private setupHandlers(): void {
    this.bot.start((ctx) => {
      ctx.reply(
        '🎤 **Bot de Transcrição de Áudio**\n\n' +
        'Envie um arquivo de áudio ou uma mensagem de voz que eu vou transcrever para texto!\n\n' +
        'Comandos disponíveis:\n' +
        '/start - Iniciar o bot\n' +
        '/help - Mostrar esta ajuda',
        { parse_mode: 'Markdown' }
      );
    });

    this.bot.help((ctx) => {
      ctx.reply(
        '🎤 **Como usar o bot:**\n\n' +
        '1. Envie um arquivo de áudio (MP3, WAV, OGG, etc.)\n' +
        '2. Ou envie uma mensagem de voz\n' +
        '3. Aguarde o processamento\n' +
        '4. Receba o texto transcrito\n\n' +
        '⚠️ **Limitações:**\n' +
        '• Arquivos até 20MB\n' +
        '• Idioma: Português\n' +
        '• Formatos suportados: MP3, WAV, OGG, M4A',
        { parse_mode: 'Markdown' }
      );
    });

    this.bot.on(message('audio'), (ctx) => {
      this.audioHandler.handleAudio(ctx);
    });
    this.bot.on(message('voice'), (ctx) => {
      this.audioHandler.handleAudio(ctx);
    });

    this.bot.on(message('text'), (ctx) => {
      const message = ctx.message.text;
      if (message && !message.startsWith('/')) {
        ctx.reply(
          '📝 Envie um arquivo de áudio ou uma mensagem de voz para transcrever!\n\n' +
          'Use /help para ver as instruções.',
          { parse_mode: 'Markdown' }
        );
      }
    });

    this.bot.catch((err, ctx) => {
      this.logger.error('Erro no bot', err instanceof Error ? err : new Error(String(err)));
      ctx.reply('❌ Ocorreu um erro interno. Tente novamente.');
    });
  }

  public async start(): Promise<void> {
    try {
      this.logger.info('Iniciando bot do Telegram...');
      await this.bot.launch();
    } catch (error) {
      this.logger.error('Erro ao iniciar bot', error as Error);
      throw error;
    }
  }
}

// Inicializar e iniciar o bot
const bot = new TelegramSpeechBot();
bot.start().catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
