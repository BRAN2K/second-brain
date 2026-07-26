import type { Template } from "@/domain/template/entities/template";
import type { CreateTemplateResponse } from "./response";

export function toResponse(template: Template): CreateTemplateResponse {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    items: template.items.map((item) => item.toJSON()),
    rules: template.rules,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}
