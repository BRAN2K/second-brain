import type { Template } from "@/domain/template/entities/template.aggregate";
import type { TemplateResponse } from "./template.response";

export const TemplatePresenter = {
  toHttp(template: Template): TemplateResponse {
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      items: template.items.map((item) => item.toJSON()),
      rules: [...template.rules],
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };
  },
};
