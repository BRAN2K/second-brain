import { TEMPLATE_BRN } from "@/domain/template/brn";
import type { Template } from "@/domain/template/entities/template";
import type { ITemplateRepository } from "@/domain/template/repositories/template";
import { NotFoundError } from "@/libs/errors";

export class GetTemplateUseCase {
  constructor(private readonly templateRepository: ITemplateRepository) {}

  async execute(id: string): Promise<Template> {
    const template = await this.templateRepository.findById(id);

    if (!template) {
      throw new NotFoundError({
        resource: TEMPLATE_BRN.resource,
        message: `Template ${id} not found`,
      });
    }

    return template;
  }
}
