import { Template } from "@/domain/template/entities/template";
import type { ITemplateRepository } from "@/domain/template/repositories/template";
import {
  TemplateItem,
  type TemplateItemProps,
} from "@/domain/template/value-objects/template-item";

export interface CreateTemplateInput {
  name: string;
  description: string;
  items: TemplateItemProps[];
  rules?: string[];
}

export class CreateTemplateUseCase {
  constructor(private readonly templateRepository: ITemplateRepository) {}

  async execute(input: CreateTemplateInput): Promise<Template> {
    const items = input.items.map((item) => TemplateItem.create(item));

    const template = Template.create({
      name: input.name,
      description: input.description,
      items: items,
      rules: input.rules,
    });

    return this.templateRepository.save(template);
  }
}
