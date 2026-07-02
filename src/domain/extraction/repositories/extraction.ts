import type { Extraction } from "@/domain/extraction/entities/extraction";

export interface ListExtractionsParams {
  cursor?: string;
  limit: number;
}

export interface IExtractionRepository {
  save(extraction: Extraction): Promise<Extraction>;
  findById(id: string): Promise<Extraction | null>;
  list(params: ListExtractionsParams): Promise<Extraction[]>;
}
