import type { TemplatesPage } from "@/domain/template/repositories/template";
import type { ListTemplatesResponse } from "./response";

export function toResponse(page: TemplatesPage): ListTemplatesResponse {
  return {
    items: page.templates.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      items: template.items.map((item) => item.toJSON()),
      rules: [...template.rules],
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    })),
    nextCursor: page.hasNext ? page.templates[page.templates.length - 1].id : null,
  };
}
