import type { Extraction } from "@/domain/extraction/entities/extraction";
import type { UuidV7 } from "@/domain/shared/types/uuid-v7";

/** Cursor-based pagination by UUIDv7 (time-ordered): newest first, `id < cursor`. */
export interface ListExtractionsParams {
  /** Return rows with `id` strictly less than this (exclusive); omit for the first page. */
  cursor?: string;
  /** Maximum rows to return. */
  limit: number;
}

/** Driven port for persisting extractions. Implemented in adapters/output/database. */
export interface ExtractionRepository {
  /** Persists a new aggregate (id already minted by the domain); returns the stored form. */
  save(extraction: Extraction): Promise<Extraction>;
  /** Returns the aggregate, or null if it does not exist or is soft-deleted. */
  findById(id: UuidV7): Promise<Extraction | null>;
  /** Newest-first page of non-deleted rows (ordered by `id` desc). */
  list(params: ListExtractionsParams): Promise<Extraction[]>;
  softDelete(id: UuidV7): Promise<void>;
}
