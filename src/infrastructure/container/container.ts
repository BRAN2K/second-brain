import type { Config } from "@/infrastructure/helpers/config";
import { createDb } from "@/infrastructure/helpers/database/postgres/client";
import { createExtractionModule } from "./modules/extraction";

export function createContainer(config: Config) {
  const db = createDb(config.DATABASE_URL);
  const extractionModule = createExtractionModule(config, { db });

  return {
    extraction: extractionModule,
  };
}
