import type { ListTemplatesUseCase } from "@/application/use-cases/template/list-templates.use-case";
import type { ListTemplatesRequest } from "./request";
import type { ListTemplatesResponse } from "./response";
import { ListTemplatesMapper } from "./mapper";
import { ListTemplatesPresenter } from "./presenter";

export class ListTemplatesController {
  constructor(private readonly listTemplatesUseCase: ListTemplatesUseCase) {}

  async execute(
    query: ListTemplatesRequest,
  ): Promise<{ status: 200; body: ListTemplatesResponse }> {
    const page = await this.listTemplatesUseCase.execute(ListTemplatesMapper.toUseCase(query));

    return { status: 200, body: ListTemplatesPresenter.toHttp(page) };
  }
}
