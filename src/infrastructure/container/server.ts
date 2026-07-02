import { Elysia } from "elysia";
import { loadConfig } from "@/infrastructure/helpers/config";
import { createContainer } from "./container";

export function startServer() {
  const config = loadConfig();
  const container = createContainer(config);

  const app = new Elysia();

  app.use(container.extraction);

  app.listen(config.PORT);

  return app;
}
