import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { env } from "@/infrastructure/env";
import { createHttpErrorHandler } from "@/libs/errors";
import { createLogger, createRequestLogger } from "@/libs/logger";
import { extractionRoutes } from "./extraction";
import { templateRoutes } from "./template";

export function startServer() {
  const logger = createLogger({
    level: env.LOG_LEVEL,
    env: env.ENV,
  });

  const app = new Elysia();

  app.use(createRequestLogger(logger));

  app.use(
    openapi({
      documentation: {
        info: { title: "Second Brain Extraction API", version: "0.1.0" },
        tags: [
          { name: "Templates", description: "Manage extraction templates" },
          { name: "Extractions", description: "Run LLM extractions" },
        ],
      },
    }),
  );

  app.use(createHttpErrorHandler(logger));

  app.use(extractionRoutes());
  app.use(templateRoutes());

  app.listen(env.PORT);

  return app;
}
