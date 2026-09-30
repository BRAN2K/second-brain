import { describe, expect, it } from "bun:test";
import { UnprocessableEntityError } from "@/libs/errors";
import { TemplateFieldKind } from "../enums/template-field-kind.enum";
import { TemplateItem } from "../value-objects/template-item.value-object";
import { Template } from "./template.aggregate";

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
