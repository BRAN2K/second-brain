/**
 * Telegram Bot Command Entry Point
 * 
 * This module initializes and starts the Telegram bot.
 */
import { Telegraf, session } from 'telegraf';
import * as dotenv from 'dotenv';
import { Context } from 'telegraf';

import { Container } from './container';

// Load environment variables from .env file
dotenv.config();

/**
 * Initialize the Telegram bot with all dependencies
 */
async function initializeBot(): Promise<Telegraf> {
  // Get required environment variables
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const postgresHost = process.env.POSTGRES_HOST;
  const postgresPort = process.env.POSTGRES_PORT;
  const postgresDb = process.env.POSTGRES_DB;
  const postgresUser = process.env.POSTGRES_USER;
  const postgresPassword = process.env.POSTGRES_PASSWORD;
  const environment = process.env.NODE_ENV || 'development';
  
  if (!telegramBotToken) {
    throw new Error('TELEGRAM_BOT_TOKEN environment variable is required');
  }
  
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }
  
  if (!postgresHost || !postgresPort || !postgresDb || !postgresUser || !postgresPassword) {
    throw new Error('PostgreSQL configuration environment variables are required');
  }
  
  // Build the connection string
  const postgresConnectionString = `postgres://${postgresUser}:${postgresPassword}@${postgresHost}:${postgresPort}/${postgresDb}`;
  
  // Initialize container with all dependencies
  const container = Container.getInstance();
  await container.initialize({
    telegramBotToken,
    geminiApiKey,
    postgresConnectionString,
    environment: environment as 'development' | 'production' | 'test'
  });
  
  // Get bot and handlers from container
  const bot = container.getTelegramBot();
  const audioHandler = container.getTelegramAudioHandlerAdapter();
  const logger = container.getLogger();
  
  // Set up middleware
  bot.use(session());
  
  // Set up command handlers
  bot.start((ctx) => {
    ctx.reply('👋 Olá! Envie um áudio de voz ou um arquivo de áudio com informações financeiras, e eu irei extrair dados financeiros para você!');
    logger.info('Bot started by user', { userId: ctx.from?.id, username: ctx.from?.username });
  });
  
  bot.help((ctx) => {
    ctx.reply(
      '📝 *Assistente Financeiro* 📝\n\n' +
      'Este bot extrai informações financeiras de áudios. Para usar:\n\n' +
      '1️⃣ Envie uma mensagem de voz ou um arquivo de áudio\n' +
      '2️⃣ Aguarde o processamento\n' +
      '3️⃣ Receba as informações financeiras extraídas\n\n' +
      '*Comandos disponíveis:*\n' +
      '/start - Inicia o bot\n' +
      '/help - Mostra esta mensagem de ajuda\n',
      { parse_mode: 'Markdown' }
    );
    logger.info('Help requested by user', { userId: ctx.from?.id, username: ctx.from?.username });
  });
  
  // Set up audio handlers
  bot.on('voice', (ctx) => audioHandler.handleAudio(ctx));
  bot.on('audio', (ctx) => audioHandler.handleAudio(ctx));
  
  // Set up error handling
  bot.catch((err: unknown, ctx: Context) => {
    if (err instanceof Error) {
      logger.error('Bot error', err);
    } else {
      logger.error('Bot error', { message: String(err) });
    }
    ctx.reply('❌ Ocorreu um erro. Por favor, tente novamente mais tarde.');
  });
  
  return bot;
}

/**
 * Start the bot
 */
export async function startTelegramBot(): Promise<void> {
  try {
    const bot = await initializeBot();
    
    // Start the bot
    await bot.launch();
    
    Container.getInstance().getLogger().info('Telegram bot started');
    
    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  } catch (error) {
    console.error('Failed to start Telegram bot:', error);
    process.exit(1);
  }
}

// If this file is run directly, start the bot
if (require.main === module) {
  startTelegramBot();
}