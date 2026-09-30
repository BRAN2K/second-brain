import type { Database } from "@/adapters/output/repositories/database";
import { Elysia } from "elysia";
import { registerGracefulShutdown } from "@/entrypoints/graceful-shutdown";
import { env } from "@/infrastructure/env";
import { createPostgresClient } from "@/libs/database/postgres/client";
import { createHttpErrorHandler } from "@/libs/errors";
import { createLogger, createRequestLogger } from "@/libs/logger";
import { docsRoutes } from "./docs/docs.route";
import { extractionRoutes } from "./extraction/extraction.routes";
import { healthRoutes } from "./health/health.routes";
import { templateRoutes } from "./template/template.routes";

export function startServer() {
  const logger = createLogger({
    level: env.LOG_LEVEL,
    env: env.APP_ENV,
  });
  const requestLogger = createRequestLogger(logger);
  const errorHandler = createHttpErrorHandler(logger);
  const db = createPostgresClient<Database>(env.DATABASE_URL);

  const app = new Elysia();

  app.use(requestLogger);
  app.use(errorHandler);

  app.use(docsRoutes());
  app.use(healthRoutes(db));
  app.use(extractionRoutes(db));
  app.use(templateRoutes(db));

  app.listen(env.PORT);

  registerGracefulShutdown(async () => {
    await app.stop();
    await db.destroy();
  });

  return app;
}

if (import.meta.main) {
  startServer();
}
