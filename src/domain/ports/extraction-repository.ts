import type { Extraction, NewExtraction } from "@/domain/entities/extraction";

/** Cursor-based pagination by UUIDv7 (time-ordered): newest first, `id < cursor`. */
export interface ListExtractionsParams {
	/** Return rows with `id` strictly less than this (exclusive); omit for the first page. */
	cursor?: string;
	/** Maximum rows to return. */
	limit: number;
}

/** Driven port for persisting extractions. Implemented in adapters/output/database. */
export interface ExtractionRepository {
	save(input: NewExtraction): Promise<Extraction>;
	/** Returns the row, or null if it does not exist or is soft-deleted. */
	findById(id: string): Promise<Extraction | null>;
	/** Newest-first page of non-deleted rows (ordered by `id` desc). */
	list(params: ListExtractionsParams): Promise<Extraction[]>;
	softDelete(id: string): Promise<void>;
}
