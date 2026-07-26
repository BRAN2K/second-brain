import { describe, expect, it } from "bun:test";
import { TemplateFieldKind } from "@/domain/template/enums/template-field-kind";
import { TemplateItem } from "@/domain/template/value-objects/template-item";
import { UnprocessableEntityError } from "@/infrastructure/helpers/errors";

describe("TemplateItem", () => {
  it("creates a valid item without a default", () => {
    const item = TemplateItem.create({
      name: "produto",
      kind: TemplateFieldKind.String,
      required: true,
    });

    expect(item.name).toBe("produto");
    expect(item.default).toBeUndefined();
  });

  it("rejects an empty name", () => {
    expect(() =>
      TemplateItem.create({ name: "", kind: TemplateFieldKind.String, required: true }),
    ).toThrow(UnprocessableEntityError);
  });

  it.each([
    [TemplateFieldKind.Number, "not-a-number"],
    [TemplateFieldKind.String, 123],
    [TemplateFieldKind.Boolean, "not-a-boolean"],
  ] as const)("rejects a %s default of the wrong type", (kind, wrongDefault) => {
    expect(() =>
      TemplateItem.create({
        name: "campo",
        kind,
        required: false,
        default: wrongDefault,
      } as never),
    ).toThrow(UnprocessableEntityError);
  });

  it("accepts a matching-type default for number, string and boolean kinds", () => {
    expect(
      TemplateItem.create({
        name: "quantidade",
        kind: TemplateFieldKind.Number,
        required: false,
        default: 1,
      }).default,
    ).toBe(1);
    expect(
      TemplateItem.create({
        name: "produto",
        kind: TemplateFieldKind.String,
        required: false,
        default: "n/a",
      }).default,
    ).toBe("n/a");
    expect(
      TemplateItem.create({
        name: "ativo",
        kind: TemplateFieldKind.Boolean,
        required: false,
        default: false,
      }).default,
    ).toBe(false);
  });

  it("rejects an invalid date string default", () => {
    expect(() =>
      TemplateItem.create({
        name: "data",
        kind: TemplateFieldKind.Date,
        required: false,
        default: "not-a-date",
      }),
    ).toThrow(UnprocessableEntityError);
  });

  it("accepts a valid ISO date string default", () => {
    const item = TemplateItem.create({
      name: "data",
      kind: TemplateFieldKind.Date,
      required: false,
      default: "2026-01-01",
    });

    expect(item.default).toBe("2026-01-01");
  });

  it("rejects an enum item with empty values", () => {
    expect(() =>
      TemplateItem.create({
        name: "status",
        kind: TemplateFieldKind.Enum,
        required: true,
        values: [],
      }),
    ).toThrow(UnprocessableEntityError);
  });

  it("rejects an enum item with duplicate values", () => {
    expect(() =>
      TemplateItem.create({
        name: "status",
        kind: TemplateFieldKind.Enum,
        required: true,
        values: ["a", "a"],
      }),
    ).toThrow(UnprocessableEntityError);
  });

  it("rejects an enum default that is not one of the declared values", () => {
    expect(() =>
      TemplateItem.create({
        name: "status",
        kind: TemplateFieldKind.Enum,
        required: false,
        values: ["a", "b"],
        default: "c",
      }),
    ).toThrow(UnprocessableEntityError);
  });

  it("accepts an enum default that is one of the declared values", () => {
    const item = TemplateItem.create({
      name: "status",
      kind: TemplateFieldKind.Enum,
      required: false,
      values: ["a", "b"],
      default: "b",
    });

    expect(item.default).toBe("b");
  });
});
