import { createDb } from "@/adapters/output/database/client";
import { KyselyExtractionRepository } from "@/adapters/output/database/extraction-repository";
import { createLlmRegistry } from "@/adapters/output/llm/index";
import { createOutputValidator } from "@/adapters/output/validation/output-validator";
import type { Config } from "@/config";

/**
 * Composition root wiring: builds concrete adapters from config and exposes them
 * for injection into routes/use-cases.
 */
export function createContainer(config: Config) {
	const db = createDb(config.DATABASE_URL);
	const extractionRepository = new KyselyExtractionRepository(db);
	const providerRegistry = createLlmRegistry(config);
	const outputValidator = createOutputValidator();

	return { db, extractionRepository, providerRegistry, outputValidator };
}

export type Container = ReturnType<typeof createContainer>;
