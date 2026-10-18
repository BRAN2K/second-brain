import type { GroqChatCompletionRequest } from "@/adapters/output/services/llm/groq/dtos/chat-completion-request";
import type { JsonSchema } from "@/adapters/output/services/llm/groq/dtos/json-schema";
import type { ExtractionInput } from "@/domain/extraction/services/extraction-llm-provider.service";
import type { TemplateItem } from "@/domain/template/value-objects/template-item.value-object";
import { GROQ_MODEL } from "@/adapters/output/services/llm/groq/constants";
import { buildExtractionPrompt } from "@/adapters/output/services/llm/prompts/extraction.prompt";
import { TemplateFieldKind } from "@/domain/template/enums/template-field-kind.enum";

export function toGroqRequest(input: ExtractionInput): GroqChatCompletionRequest {
  return {
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: buildExtractionPrompt(input.template, input.instructions) },
      { role: "user", content: input.content },
    ],
    temperature: 0,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "extraction",
        strict: true,
        schema: responseSchema(input.template.items),
      },
    },
  };
}

// Strict mode requires every field in `required` and `additionalProperties: false`,
// so optional/missing fields are expressed as nullable type unions.
function responseSchema(items: TemplateItem[]): JsonSchema {
  const names = items.map((item) => item.name);

  return {
    type: "object",
    properties: Object.fromEntries(items.map((item) => [item.name, fieldSchema(item)])),
    required: names,
    additionalProperties: false,
  };
}

function fieldSchema(item: TemplateItem): JsonSchema {
  const schema: JsonSchema = kindSchema(item);

  const description = fieldDescription(item);
  if (description) {
    schema.description = description;
  }

  return schema;
}

function kindSchema(item: TemplateItem): JsonSchema {
  switch (item.kind) {
    case TemplateFieldKind.Number:
      return { type: ["number", "null"] };
    case TemplateFieldKind.Boolean:
      return { type: ["boolean", "null"] };
    case TemplateFieldKind.Enum:
      return { type: ["string", "null"], enum: [...(item.values ?? []), null] };
    default:
      return { type: ["string", "null"] };
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

  if (item.kind === TemplateFieldKind.Date) {
    lines.push("ISO 8601 date-time in UTC");
  }

  return lines.length > 0 ? lines.join("\n") : undefined;
}
