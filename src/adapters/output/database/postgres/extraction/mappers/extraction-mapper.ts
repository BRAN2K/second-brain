import type { Insertable, Selectable } from "kysely";
import type { ExtractionSourceType } from "@/domain/extraction/enums/extraction-source-type.enum";
import type { ExtractionMetaProps } from "@/domain/extraction/value-objects/extraction-meta.value-object";
import type { ExtractionMissingFieldProps } from "@/domain/extraction/value-objects/extraction-missing-field.value-object";
import type { TemplateSnapshotProps } from "@/domain/extraction/value-objects/template-snapshot.value-object";
import type { TemplateItemProps } from "@/domain/template/value-objects/template-item.value-object";
import type { ExtractionTable } from "../../types";
import { Extraction } from "@/domain/extraction/entities/extraction.aggregate";
import { ExtractionMeta } from "@/domain/extraction/value-objects/extraction-meta.value-object";
import { ExtractionMissingField } from "@/domain/extraction/value-objects/extraction-missing-field.value-object";
import { TemplateSnapshot } from "@/domain/extraction/value-objects/template-snapshot.value-object";
import { TemplateItem } from "@/domain/template/value-objects/template-item.value-object";

// Persisted jsonb shape: items are the VO props, not class instances.
type TemplateSnapshotRow = Omit<TemplateSnapshotProps, "items"> & {
  items: TemplateItemProps[];
};

export function toPersistence(extraction: Extraction): Insertable<ExtractionTable> {
  return {
    id: extraction.id,
    template_id: extraction.templateId,
    created_at: extraction.createdAt,
    source_type: extraction.sourceType as "text" | "audio",
    input_text: extraction.inputText,
    template: JSON.stringify(extraction.template),
    result: extraction.result == null ? null : JSON.stringify(extraction.result),
    missing_fields: JSON.stringify(extraction.missingFields),
    provider: extraction.provider,
    model: extraction.model,
    meta: JSON.stringify(extraction.meta),
  };
}

export function toDomain(row: Selectable<ExtractionTable>): Extraction {
  const rawTemplate = row.template as TemplateSnapshotRow;

  return Extraction.reconstitute({
    id: row.id,
    templateId: row.template_id,
    createdAt: row.created_at,
    sourceType: row.source_type as ExtractionSourceType,
    inputText: row.input_text,
    template: TemplateSnapshot.reconstitute({
      ...rawTemplate,
      items: rawTemplate.items.map((item) => TemplateItem.reconstitute(item)),
    }),
    result: row.result,
    missingFields: (row.missing_fields as ExtractionMissingFieldProps[]).map((field) =>
      ExtractionMissingField.reconstitute(field),
    ),
    provider: row.provider,
    model: row.model,
    meta: ExtractionMeta.reconstitute(row.meta as ExtractionMetaProps),
  });
}
