import type { GeminiGenerateContentRequest } from "@/adapters/output/llm/gemini/dtos/generate-content-request";
import type { GeminiSchema } from "@/adapters/output/llm/gemini/dtos/response-schema";
import { buildExtractionPrompt } from "@/adapters/output/llm/prompts/extraction-prompt";
import type { ExtractionInput } from "@/domain/extraction/ports/http/extraction-llm-provider";
import { TemplateFieldKind } from "@/domain/template/enums/template-field-kind";
import type { TemplateItem } from "@/domain/template/value-objects/template-item";

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
  const schema: GeminiSchema = { type: "STRING", nullable: true };

  switch (item.kind) {
    case TemplateFieldKind.Number:
      schema.type = "NUMBER";
      break;
    case TemplateFieldKind.Boolean:
      schema.type = "BOOLEAN";
      break;
    case TemplateFieldKind.Date:
      schema.format = "date-time";
      break;
    case TemplateFieldKind.Enum:
      schema.enum = item.values;
      break;
  }

  const description = [item.description, ...(item.rules ?? [])].filter(Boolean).join("\n");
  if (description) {
    schema.description = description;
  }

  return schema;
}
