import type { ExtractionFieldValue } from "@/domain/extraction/ports/extraction-llm-provider";
import { ExtractionMissingField } from "@/domain/extraction/value-objects/extraction-missing-field";
import type { TemplateItem } from "@/domain/template/value-objects/template-item";

export interface ExtractionData {
  result: Record<string, ExtractionFieldValue>;
  missingFields: ExtractionMissingField[];
}

export function toExtractionData(
  items: TemplateItem[],
  data: Record<string, ExtractionFieldValue>,
): ExtractionData {
  const result: Record<string, ExtractionFieldValue> = {};
  const missingFields: ExtractionMissingField[] = [];

  for (const item of items) {
    const value = data[item.name];

    if (value !== undefined && value !== null) {
      result[item.name] = value;
      continue;
    }

    if (item.default !== undefined) {
      result[item.name] = item.default;
      missingFields.push(ExtractionMissingField.create({ field: item.name, usedDefault: true }));
      continue;
    }

    if (item.required) {
      missingFields.push(ExtractionMissingField.create({ field: item.name, usedDefault: false }));
    }
  }

  return { result, missingFields };
}
