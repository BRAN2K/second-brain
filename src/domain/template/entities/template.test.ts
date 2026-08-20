import { describe, expect, it } from "bun:test";
import { Template } from "@/domain/template/entities/template";
import { TemplateFieldKind } from "@/domain/template/enums/template-field-kind";
import { TemplateItem } from "@/domain/template/value-objects/template-item";
import { UnprocessableEntityError } from "@/libs/errors";

function baseTemplate(): Template {
  return Template.create({
    name: "compra",
    description: "nota de compra",
    items: [
      TemplateItem.create({ name: "produto", kind: TemplateFieldKind.String, required: true }),
    ],
  });
}

describe("Template behaviors", () => {
  it("renames and touches updatedAt", async () => {
    const template = baseTemplate();
    const before = template.updatedAt.getTime();
    await Bun.sleep(2);
    template.rename("venda");
    expect(template.name).toBe("venda");
    expect(template.updatedAt.getTime()).toBeGreaterThan(before);
  });

  it("rejects renaming to empty", () => {
    const template = baseTemplate();
    expect(() => template.rename("")).toThrow(UnprocessableEntityError);
  });

  it("soft deletes once and is idempotent", async () => {
    const template = baseTemplate();
    expect(template.deletedAt).toBeNull();
    await Bun.sleep(2);
    template.softDelete();
    expect(template.deletedAt).not.toBeNull();
    const first = template.deletedAt?.getTime() ?? -1;
    await Bun.sleep(2);
    template.softDelete();
    expect(template.deletedAt?.getTime() ?? -1).toBe(first);
  });
});
