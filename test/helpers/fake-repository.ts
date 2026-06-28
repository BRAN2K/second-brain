import type { Extraction } from "@/domain/extraction/entities/extraction";
import type {
  ExtractionRepository,
  ListExtractionsParams,
} from "@/domain/extraction/repositories/extraction";
import type { UuidV7 } from "@/domain/shared/types/uuid-v7";

/** In-memory `ExtractionRepository` for HTTP/use-case tests (no DB). */
export interface FakeRepository extends ExtractionRepository {
  saved: Extraction[];
}

export function fakeRepository(): FakeRepository {
  const saved: Extraction[] = [];
  return {
    saved,
    async save(extraction: Extraction): Promise<Extraction> {
      // The aggregate already owns its id/timestamps; just store it.
      saved.push(extraction);
      return extraction;
    },
    async findById(id: UuidV7): Promise<Extraction | null> {
      return (
        saved.find((row) => row.id === id && row.deletedAt === null) ?? null
      );
    },
    async list({
      cursor,
      limit,
    }: ListExtractionsParams): Promise<Extraction[]> {
      return saved
        .filter((row) => row.deletedAt === null)
        .filter((row) => (cursor ? row.id < cursor : true))
        .sort((a, b) => (a.id < b.id ? 1 : -1)) // id desc
        .slice(0, limit);
    },
    async softDelete(): Promise<void> {},
  };
}
