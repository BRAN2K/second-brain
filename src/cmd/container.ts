import { createDb } from "@/adapters/output/database/client";
import { KyselyExtractionRepository } from "@/adapters/output/database/extraction-repository";
import type { Config } from "@/config";

/**
 * Composition root wiring: builds concrete adapters from config and exposes them
 * for injection into routes/use-cases.
 */
export function createContainer(config: Config) {
	const db = createDb(config.DATABASE_URL);
	const extractionRepository = new KyselyExtractionRepository(db);

	return { db, extractionRepository };
}

export type Container = ReturnType<typeof createContainer>;
