import type { CreateTemplateInput } from "@/application/use-cases/template/dtos/create-template.dto";
import type { CreateTemplateRequest } from "./request";

export const CreateTemplateMapper = {
  toUseCase(body: CreateTemplateRequest): CreateTemplateInput {
    return {
      name: body.name,
      description: body.description,
      items: body.items,
      rules: body.rules,
    };
  },
};
