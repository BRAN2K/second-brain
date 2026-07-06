import type { Template } from "@/domain/template/entities/template";

export interface ListTemplatesParams {
  cursor?: string;
  limit: number;
}

export interface ITemplateRepository {
  save(template: Template): Promise<Template>;
  findById(id: string): Promise<Template | null>;
  list(params: ListTemplatesParams): Promise<Template[]>;
}
