import type { Template } from "@/domain/template/entities/template.aggregate";

export interface ListTemplatesParams {
  cursor?: string;
  limit: number;
}

export interface TemplatesPage {
  templates: Template[];
  hasNext: boolean;
}

export interface ITemplateRepository {
  save(template: Template): Promise<Template>;
  findById(id: string): Promise<Template | null>;
  list(params: ListTemplatesParams): Promise<TemplatesPage>;
}
