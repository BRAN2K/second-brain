import type { Template } from "@/domain/template/entities/template";
import type { ITemplateRepository } from "@/domain/template/repositories/template";

export interface ListTemplatesInput {
  cursor?: string;
  limit?: number;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export class ListTemplatesUseCase {
  constructor(private readonly templateRepository: ITemplateRepository) {}

  async execute(input: ListTemplatesInput = {}): Promise<Template[]> {
    const limit = Math.min(input.limit ?? DEFAULT_LIMIT, MAX_LIMIT);

    return this.templateRepository.list({ cursor: input.cursor, limit });
  }
}
