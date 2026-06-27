import { describe, expect, it } from "bun:test";
import type { Template } from "@/domain/extraction/entities/template";
import { TemplateInvalid } from "@/domain/extraction/errors/template-invalid";
import { templateToSchema } from "@/domain/extraction/services/template-to-schema";

describe("templateToSchema", () => {
  it("maps primitive types to JSON Schema", () => {
    const template: Template = [
      { name: "title", type: "string", required: true },
      { name: "amount", type: "number", required: false },
      { name: "paid", type: "boolean", required: false },
    ];

    const { schema } = templateToSchema(template);

    expect(schema.type).toBe("object");
    expect(schema.additionalProperties).toBe(false);
    expect(schema.properties).toEqual({
      title: { type: "string" },
      amount: { type: "number" },
      paid: { type: "boolean" },
    });
  });

  it("maps date to string + date format", () => {
    const { schema } = templateToSchema([
      { name: "due", type: "date", required: false },
    ]);
    expect(schema.properties.due).toEqual({ type: "string", format: "date" });
  });

  it("maps enum to string + enum values", () => {
    const { schema } = templateToSchema([
      {
        name: "status",
        type: "enum",
        required: true,
        values: ["open", "done"],
      },
    ]);
    expect(schema.properties.status).toEqual({
      type: "string",
      enum: ["open", "done"],
    });
  });

  it("maps array of a primitive to array + items", () => {
    const { schema } = templateToSchema([
      {
        name: "tags",
        type: "array",
        required: false,
        items: { type: "string" },
      },
    ]);
    expect(schema.properties.tags).toEqual({
      type: "array",
      items: { type: "string" },
    });
  });

  it("maps array of enum to array + enum items", () => {
    const { schema } = templateToSchema([
      {
        name: "labels",
        type: "array",
        required: false,
        items: { type: "enum", values: ["a", "b"] },
      },
    ]);
    expect(schema.properties.labels).toEqual({
      type: "array",
      items: { type: "string", enum: ["a", "b"] },
    });
  });

  it("attaches description when present", () => {
    const { schema } = templateToSchema([
      {
        name: "title",
        type: "string",
        required: true,
        description: "the title",
      },
    ]);
    expect(schema.properties.title).toEqual({
      type: "string",
      description: "the title",
    });
  });

  it("collects required field names (in both schema and metadata)", () => {
    const { schema, required } = templateToSchema([
      { name: "a", type: "string", required: true },
      { name: "b", type: "string", required: false },
      { name: "c", type: "number", required: true },
    ]);
    expect(required).toEqual(["a", "c"]);
    expect(schema.required).toEqual(["a", "c"]);
  });

  it("preserves field order in properties and required", () => {
    const { schema, required } = templateToSchema([
      { name: "z", type: "string", required: true },
      { name: "a", type: "string", required: true },
    ]);
    expect(Object.keys(schema.properties)).toEqual(["z", "a"]);
    expect(required).toEqual(["z", "a"]);
  });

  describe("invalid templates", () => {
    it("rejects an empty template", () => {
      expect(() => templateToSchema([])).toThrow(TemplateInvalid);
    });

    it("rejects an enum without values", () => {
      expect(() =>
        templateToSchema([{ name: "s", type: "enum", required: true }]),
      ).toThrow(TemplateInvalid);
    });

    it("rejects an enum with duplicate values", () => {
      expect(() =>
        templateToSchema([
          { name: "s", type: "enum", required: true, values: ["x", "x"] },
        ]),
      ).toThrow(TemplateInvalid);
    });

    it("rejects an array without items", () => {
      expect(() =>
        templateToSchema([{ name: "t", type: "array", required: false }]),
      ).toThrow(TemplateInvalid);
    });

    it("rejects duplicate field names", () => {
      expect(() =>
        templateToSchema([
          { name: "dup", type: "string", required: true },
          { name: "dup", type: "number", required: false },
        ]),
      ).toThrow(TemplateInvalid);
    });

    it("rejects a blank field name", () => {
      expect(() =>
        templateToSchema([{ name: "  ", type: "string", required: true }]),
      ).toThrow(TemplateInvalid);
    });

    it("collects every issue, not just the first", () => {
      try {
        templateToSchema([
          { name: "s", type: "enum", required: true },
          { name: "t", type: "array", required: false },
        ]);
        throw new Error("expected templateToSchema to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(TemplateInvalid);
        expect((error as TemplateInvalid).issues).toHaveLength(2);
      }
    });
  });
});
