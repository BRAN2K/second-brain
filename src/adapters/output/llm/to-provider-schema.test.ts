import { describe, expect, it } from "bun:test";
import {
  schemaInstruction,
  toGeminiSchema,
} from "@/adapters/output/llm/to-provider-schema";
import { templateToSchema } from "@/domain/extraction/services/template-to-schema";

const { schema } = templateToSchema([
  { name: "title", type: "string", required: true, description: "the title" },
  { name: "amount", type: "number", required: false },
  { name: "paid", type: "boolean", required: false },
  { name: "due", type: "date", required: false },
  { name: "status", type: "enum", required: true, values: ["open", "done"] },
  { name: "tags", type: "array", required: false, items: { type: "string" } },
]);

describe("schemaInstruction (OpenAI-compatible)", () => {
  it("embeds the canonical schema and the null guidance", () => {
    const text = schemaInstruction(schema);
    expect(text).toContain(JSON.stringify(schema));
    expect(text.toLowerCase()).toContain("null");
    expect(text.toLowerCase()).toContain("json only");
  });
});

describe("toGeminiSchema", () => {
  const gemini = toGeminiSchema(schema);

  it("produces an OBJECT with the canonical required list", () => {
    expect(gemini.type).toBe("OBJECT");
    expect(gemini.required).toEqual(["title", "status"]);
  });

  it("maps leaf types to the Gemini dialect (uppercase, nullable)", () => {
    expect(gemini.properties?.title).toEqual({
      type: "STRING",
      nullable: true,
      description: "the title",
    });
    expect(gemini.properties?.amount).toEqual({
      type: "NUMBER",
      nullable: true,
    });
    expect(gemini.properties?.paid).toEqual({
      type: "BOOLEAN",
      nullable: true,
    });
    expect(gemini.properties?.due).toEqual({ type: "STRING", nullable: true });
  });

  it("maps enum to STRING + enum + format", () => {
    expect(gemini.properties?.status).toEqual({
      type: "STRING",
      nullable: true,
      format: "enum",
      enum: ["open", "done"],
    });
  });

  it("maps array to ARRAY with typed items", () => {
    expect(gemini.properties?.tags).toEqual({
      type: "ARRAY",
      nullable: true,
      items: { type: "STRING", nullable: true },
    });
  });
});
