import type { Template } from "@/domain/template/entities/template";
import { TemplateNotFound } from "@/domain/template/errors/template-not-found";
import type { ITemplateRepository } from "@/domain/template/repositories/template";

export class GetTemplateUseCase {
  constructor(private readonly templateRepository: ITemplateRepository) {}

  async execute(id: string): Promise<Template> {
    const template = await this.templateRepository.findById(id);

    if (!template) {
      throw new TemplateNotFound(id);
    }

    return template;
  }
}
