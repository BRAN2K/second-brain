import type { CreateTemplateUseCase } from "@/application/use-cases/template/create-template.use-case";
import type { TemplateResponse } from "../_shared/template.response";
import type { CreateTemplateRequest } from "./request";
import { TemplatePresenter } from "../_shared/template.presenter";
import { CreateTemplateMapper } from "./mapper";

export class CreateTemplateController {
  constructor(private readonly createTemplateUseCase: CreateTemplateUseCase) {}

  async execute(body: CreateTemplateRequest): Promise<{ status: 201; body: TemplateResponse }> {
    const template = await this.createTemplateUseCase.execute(CreateTemplateMapper.toUseCase(body));

    return { status: 201, body: TemplatePresenter.toHttp(template) };
  }
}
