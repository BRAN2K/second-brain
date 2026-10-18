import type { TemplateItemProps } from "@/domain/template/value-objects/template-item.value-object";

export interface CreateTemplateInput {
  name: string;
  description: string;
  items: TemplateItemProps[];
  rules?: string[];
}
