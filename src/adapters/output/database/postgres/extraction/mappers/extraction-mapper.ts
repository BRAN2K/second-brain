import type { Insertable, Selectable } from "kysely";
import { Extraction } from "@/domain/extraction/entities/extraction";
import type { ExtractionSourceType } from "@/domain/extraction/enums/extraction-source-type";
import type { ExtractionTable } from "../../types";

export function toPersistence(
  extraction: Extraction,
): Insertable<ExtractionTable> {
  return {
    id: extraction.id,
    created_at: extraction.createdAt,
    source_type: extraction.sourceType as "text" | "audio",
    input_text: extraction.inputText,
    template: JSON.stringify(extraction.template),
    result:
      extraction.result == null ? null : JSON.stringify(extraction.result),
    missing_fields: JSON.stringify(extraction.missingFields),
    complete: extraction.complete,
    provider: extraction.provider,
    model: extraction.model,
    meta: JSON.stringify(extraction.meta),
  };
}

export function toDomain(row: Selectable<ExtractionTable>): Extraction {
  return Extraction.reconstitute({
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    sourceType: row.source_type as ExtractionSourceType,
    inputText: row.input_text,
    template: row.template,
    result: row.result,
    missingFields: row.missing_fields,
    complete: row.complete,
    provider: row.provider,
    model: row.model,
    meta: row.meta,
  });
}
