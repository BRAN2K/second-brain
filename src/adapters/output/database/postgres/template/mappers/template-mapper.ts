import type { Insertable, Selectable } from "kysely";
import type { TemplateItemProps } from "@/domain/template/value-objects/template-item";
import type { TemplateTable } from "../../types";
import { Template } from "@/domain/template/entities/template";
import { TemplateItem } from "@/domain/template/value-objects/template-item";

export function toPersistence(template: Template): Insertable<TemplateTable> {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    items: JSON.stringify(template.items),
    rules: [...template.rules],
    created_at: template.createdAt,
  };
}

export function toDomain(row: Selectable<TemplateTable>): Template {
  return Template.reconstitute({
    id: row.id,
    name: row.name,
    description: row.description,
    items: (row.items as TemplateItemProps[]).map((item) => TemplateItem.reconstitute(item)),
    rules: row.rules ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  });
}
