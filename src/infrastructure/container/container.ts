import type { Config } from "@/libs/config";
import { createDb } from "@/libs/database/postgres/client";
import { createExtractionModule } from "./modules/extraction";
import { createTemplateModule } from "./modules/template";

export function createContainer(config: Config) {
  const db = createDb(config.DATABASE_URL);
  const extractionModule = createExtractionModule(config, { db });
  const templateModule = createTemplateModule(config, { db });

  return {
    extraction: extractionModule,
    template: templateModule,
  };
}
