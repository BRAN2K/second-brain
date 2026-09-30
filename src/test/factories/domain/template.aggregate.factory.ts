import type { TemplateItemProps } from "@/domain/template/value-objects/template-item.value-object";
import { Template } from "@/domain/template/entities/template.aggregate";
import { TemplateFieldKind } from "@/domain/template/enums/template-field-kind.enum";
import { TemplateItem } from "@/domain/template/value-objects/template-item.value-object";

interface MakeTemplateInput {
  name?: string;
  description?: string;
  items?: TemplateItemProps[];
  rules?: string[];
}

export function makeTemplate(input: MakeTemplateInput = {}): Template {
  return Template.create({
    name: input.name ?? "compra",
    description: input.description ?? "Template para extrair informações de compras",
    items: (
      input.items ?? [{ name: "produto", kind: TemplateFieldKind.String, required: true }]
    ).map((item) => TemplateItem.create(item)),
    rules: input.rules,
  });
}
