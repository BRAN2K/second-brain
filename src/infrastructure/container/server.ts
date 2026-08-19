import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { loadConfig } from "@/libs/config";
import { createHttpErrorHandler } from "@/libs/errors";
import { createLogger, createRequestLogger } from "@/libs/logger";
import { createContainer } from "./container";

export function startServer() {
  const config = loadConfig();
  const container = createContainer(config);
  const logger = createLogger(config);

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

  app.use(container.extraction);
  app.use(container.template);

  app.listen(config.PORT);

  return app;
}
