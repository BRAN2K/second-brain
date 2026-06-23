import type { Extraction, NewExtraction } from "@/domain/entities/extraction";

/** Driven port for persisting extractions. Implemented in adapters/output/database. */
export interface ExtractionRepository {
	save(input: NewExtraction): Promise<Extraction>;
	/** Returns the row, or null if it does not exist or is soft-deleted. */
	findById(id: string): Promise<Extraction | null>;
	softDelete(id: string): Promise<void>;
}
