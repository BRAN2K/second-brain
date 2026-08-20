import type { GeminiGenerateContentRequest } from "@/adapters/output/llm/gemini/dtos/generate-content-request";
import type { GeminiSchema } from "@/adapters/output/llm/gemini/dtos/response-schema";
import type { ExtractionInput } from "@/domain/extraction/ports/extraction-llm-provider";
import type { TemplateItem } from "@/domain/template/value-objects/template-item";
import { buildExtractionPrompt } from "@/adapters/output/llm/prompts/extraction-prompt";
import { TemplateFieldKind } from "@/domain/template/enums/template-field-kind";

export function toGeminiRequest(input: ExtractionInput): GeminiGenerateContentRequest {
  return {
    systemInstruction: {
      parts: [{ text: buildExtractionPrompt(input.template, input.instructions) }],
    },
    contents: [{ role: "user", parts: [{ text: input.content }] }],
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: responseSchema(input.template.items),
    },
  };
}

// Every field is required and nullable: the model must emit all template
// fields, using null for the ones it cannot find in the text.
function responseSchema(items: TemplateItem[]): GeminiSchema {
  const names = items.map((item) => item.name);

  return {
    type: "OBJECT",
    properties: Object.fromEntries(items.map((item) => [item.name, fieldSchema(item)])),
    required: names,
    propertyOrdering: names,
  };
}

function fieldSchema(item: TemplateItem): GeminiSchema {
  const schema: GeminiSchema = { ...kindSchema(item), nullable: true };

  const description = fieldDescription(item);
  if (description) {
    schema.description = description;
  }

  return schema;
}

function kindSchema(item: TemplateItem): GeminiSchema {
  switch (item.kind) {
    case TemplateFieldKind.Number:
      return { type: "NUMBER" };
    case TemplateFieldKind.Boolean:
      return { type: "BOOLEAN" };
    case TemplateFieldKind.Date:
      return { type: "STRING", format: "date-time" };
    case TemplateFieldKind.Enum:
      return { type: "STRING", enum: item.values };
    default:
      return { type: "STRING" };
  }
}

function fieldDescription(item: TemplateItem): string | undefined {
  const lines: string[] = [];

  if (item.description) {
    lines.push(item.description);
  }

  if (item.rules) {
    lines.push(...item.rules);
  }

  return lines.length > 0 ? lines.join("\n") : undefined;
}
