/**
 * Bot Entry Point
 * 
 * This is the main entry point for the Telegram bot application.
 * It simply delegates to the cmd/telegram-bot.ts module.
 */
import { startTelegramBot } from './cmd/telegram-bot';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Set up global error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  // Keep process alive but log the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  // Keep process alive but log the error
});

// Start the bot
startTelegramBot()
  .then(() => console.log('Bot started successfully'))
  .catch(err => {
    console.error('Failed to start bot:', err);
    process.exit(1);
  });
