import { describe, expect, it } from "bun:test";
import { buildSnapshot } from "@/adapters/output/llm/gemini/test-fixtures";
import { buildExtractionPrompt } from "@/adapters/output/llm/prompts/extraction-prompt";
import { TemplateSnapshot } from "@/domain/extraction/value-objects/template-snapshot.value-object";
import { Template } from "@/domain/template/entities/template.aggregate";
import { TemplateFieldKind } from "@/domain/template/enums/template-field-kind.enum";
import { TemplateItem } from "@/domain/template/value-objects/template-item.value-object";

describe("buildExtractionPrompt", () => {
  it("includes template context, null guidance, rules and extra instructions", () => {
    const prompt = buildExtractionPrompt(buildSnapshot(), "considere valores em reais");

    expect(prompt).toContain('template "compra"');
    expect(prompt).toContain("Template para extrair informações de compras");
    expect(prompt).toContain("Use null");
    expect(prompt).toContain("Never invent values");
    expect(prompt).toContain("Compras genéricas como `mercado` devem ter quantidade 1.");
    expect(prompt).toContain("considere valores em reais");
  });

  it("omits the rules and instructions sections when there is nothing to add", () => {
    const snapshot = TemplateSnapshot.fromTemplate(
      Template.create({
        name: "nota",
        description: "Template simples",
        items: [
          TemplateItem.create({ name: "titulo", kind: TemplateFieldKind.String, required: true }),
        ],
      }),
    );

    const prompt = buildExtractionPrompt(snapshot);

    expect(prompt).not.toContain("Template rules:");
    expect(prompt).not.toContain("Additional instructions:");
  });
});
