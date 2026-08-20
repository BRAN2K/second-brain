import type { TemplateSnapshot } from "@/domain/extraction/value-objects/template-snapshot.value-object";

// Provider-agnostic system prompt for extraction. It expresses the
// IExtractionLLMProvider contract: fill every template field, null when the
// information is absent, never invent values.
export function buildExtractionPrompt(template: TemplateSnapshot, instructions?: string): string {
  const lines = [
    `You extract structured data from the user's text into the template "${template.name}".`,
    `Template description: ${template.description}`,
    "Fill every field defined by the response schema.",
    "Use null for any field whose information is not present in the text. Never invent values.",
    "Date fields must use the ISO format YYYY-MM-DDThh:mm:ssZ, always in UTC 0.",
  ];

  if (template.rules.length > 0) {
    lines.push("Template rules:", ...template.rules.map((rule) => `- ${rule}`));
  }

  if (instructions) {
    lines.push("Additional instructions:", instructions);
  }

  return lines.join("\n");
}
