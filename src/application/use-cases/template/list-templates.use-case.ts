import type { ListTemplatesInput } from "@/application/use-cases/template/dtos/list-templates.dto";
import type {
  ITemplateRepository,
  TemplatesPage,
} from "@/domain/template/repositories/template.repository";

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export class ListTemplatesUseCase {
  constructor(private readonly templateRepository: ITemplateRepository) {}

  async execute(input: ListTemplatesInput = {}): Promise<TemplatesPage> {
    const limit = Math.min(input.limit ?? DEFAULT_LIMIT, MAX_LIMIT);

    return this.templateRepository.list({ cursor: input.cursor, limit });
  }
}
