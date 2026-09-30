export function registerGracefulShutdown(cleanup: () => Promise<void>): void {
  let shuttingDown = false;

  const shutdown = async () => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;

    try {
      await cleanup();
      process.exit(0);
    } catch {
      process.exit(1);
    }
  };

  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}
