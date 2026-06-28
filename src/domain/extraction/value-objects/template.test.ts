import { describe, expect, it } from "bun:test";
import { TemplateInvalid } from "@/domain/extraction/errors/template-invalid";
import {
  type RawTemplateField,
  Template,
} from "@/domain/extraction/value-objects/template";

describe("Template.toCanonicalSchema", () => {
  it("maps primitive types to JSON Schema", () => {
    const schema = Template.create([
      { name: "title", type: "string", required: true },
      { name: "amount", type: "number", required: false },
      { name: "paid", type: "boolean", required: false },
    ]).toCanonicalSchema();

    expect(schema.type).toBe("object");
    expect(schema.additionalProperties).toBe(false);
    expect(schema.properties).toEqual({
      title: { type: "string" },
      amount: { type: "number" },
      paid: { type: "boolean" },
    });
  });

  it("maps date to string + date format", () => {
    const schema = Template.create([
      { name: "due", type: "date", required: false },
    ]).toCanonicalSchema();
    expect(schema.properties.due).toEqual({ type: "string", format: "date" });
  });

  it("maps enum to string + enum values", () => {
    const schema = Template.create([
      {
        name: "status",
        type: "enum",
        required: true,
        values: ["open", "done"],
      },
    ]).toCanonicalSchema();
    expect(schema.properties.status).toEqual({
      type: "string",
      enum: ["open", "done"],
    });
  });

  it("maps array of a primitive to array + items", () => {
    const schema = Template.create([
      {
        name: "tags",
        type: "array",
        required: false,
        items: { type: "string" },
      },
    ]).toCanonicalSchema();
    expect(schema.properties.tags).toEqual({
      type: "array",
      items: { type: "string" },
    });
  });

  it("maps array of enum to array + enum items", () => {
    const schema = Template.create([
      {
        name: "labels",
        type: "array",
        required: false,
        items: { type: "enum", values: ["a", "b"] },
      },
    ]).toCanonicalSchema();
    expect(schema.properties.labels).toEqual({
      type: "array",
      items: { type: "string", enum: ["a", "b"] },
    });
  });

  it("attaches description when present", () => {
    const schema = Template.create([
      {
        name: "title",
        type: "string",
        required: true,
        description: "the title",
      },
    ]).toCanonicalSchema();
    expect(schema.properties.title).toEqual({
      type: "string",
      description: "the title",
    });
  });

  it("collects required field names (in both schema and metadata)", () => {
    const template = Template.create([
      { name: "a", type: "string", required: true },
      { name: "b", type: "string", required: false },
      { name: "c", type: "number", required: true },
    ]);
    expect(template.requiredNames).toEqual(["a", "c"]);
    expect(template.toCanonicalSchema().required).toEqual(["a", "c"]);
  });

  it("preserves field order in properties and required", () => {
    const template = Template.create([
      { name: "z", type: "string", required: true },
      { name: "a", type: "string", required: true },
    ]);
    expect(Object.keys(template.toCanonicalSchema().properties)).toEqual([
      "z",
      "a",
    ]);
    expect(template.requiredNames).toEqual(["z", "a"]);
  });
});

describe("Template.create — invalid templates", () => {
  const expectInvalid = (raw: RawTemplateField[]) =>
    expect(() => Template.create(raw)).toThrow(TemplateInvalid);

  it("rejects an empty template", () => {
    expectInvalid([]);
  });
  it("rejects an enum without values", () => {
    expectInvalid([{ name: "s", type: "enum", required: true }]);
  });
  it("rejects an enum with duplicate values", () => {
    expectInvalid([
      { name: "s", type: "enum", required: true, values: ["x", "x"] },
    ]);
  });
  it("rejects an array without items", () => {
    expectInvalid([{ name: "t", type: "array", required: false }]);
  });
  it("rejects an unsupported type", () => {
    expectInvalid([{ name: "x", type: "object", required: true }]);
  });
  it("rejects duplicate field names", () => {
    expectInvalid([
      { name: "dup", type: "string", required: true },
      { name: "dup", type: "number", required: false },
    ]);
  });
  it("rejects a blank field name", () => {
    expectInvalid([{ name: "  ", type: "string", required: true }]);
  });

  it("collects every issue, not just the first", () => {
    try {
      Template.create([
        { name: "s", type: "enum", required: true },
        { name: "t", type: "array", required: false },
      ]);
      throw new Error("expected Template.create to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(TemplateInvalid);
      expect((error as TemplateInvalid).issues).toHaveLength(2);
    }
  });
});

describe("Template.findMissingFields", () => {
  const template = Template.create([
    { name: "a", type: "string", required: true },
    { name: "b", type: "number", required: true },
    { name: "c", type: "string", required: false },
  ]);

  it("returns nothing when all required fields are present", () => {
    expect(template.findMissingFields({ a: "x", b: 1, c: "extra" })).toEqual(
      [],
    );
  });
  it("flags absent required fields", () => {
    expect(template.findMissingFields({ a: "x" })).toEqual(["b"]);
  });
  it("flags null / empty / whitespace as missing", () => {
    expect(template.findMissingFields({ a: null, b: 1 })).toEqual(["a"]);
    expect(template.findMissingFields({ a: "", b: 1 })).toEqual(["a"]);
    expect(template.findMissingFields({ a: "   ", b: 1 })).toEqual(["a"]);
  });
  it("ignores non-required fields entirely", () => {
    expect(template.findMissingFields({ a: "x", b: 1, c: null })).toEqual([]);
  });
  it("treats non-object data as everything required missing", () => {
    expect(template.findMissingFields(null)).toEqual(["a", "b"]);
    expect(template.findMissingFields("not an object")).toEqual(["a", "b"]);
  });

  it("does NOT flag 0 / false / empty array (legitimate values)", () => {
    const t = Template.create([
      { name: "n", type: "number", required: true },
      { name: "flag", type: "boolean", required: true },
      { name: "arr", type: "array", required: true, items: { type: "string" } },
    ]);
    expect(t.findMissingFields({ n: 0, flag: false, arr: [] })).toEqual([]);
  });

  it("preserves the order of the required list", () => {
    const t = Template.create([
      { name: "z", type: "string", required: true },
      { name: "a", type: "string", required: true },
      { name: "m", type: "string", required: true },
    ]);
    expect(t.findMissingFields({})).toEqual(["z", "a", "m"]);
  });
});
