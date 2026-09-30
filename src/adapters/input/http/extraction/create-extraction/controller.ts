import type { CreateExtractionUseCase } from "@/application/use-cases/extraction/create-extraction.use-case";
import type { CreateExtractionRequest } from "./request";
import type { CreateExtractionResponse } from "./response";
import { CreateExtractionMapper } from "./mapper";
import { CreateExtractionPresenter } from "./presenter";

export class CreateExtractionController {
  constructor(private readonly createExtractionUseCase: CreateExtractionUseCase) {}

  async execute(
    body: CreateExtractionRequest,
  ): Promise<{ status: 201; body: CreateExtractionResponse }> {
    const extraction = await this.createExtractionUseCase.execute(
      CreateExtractionMapper.toUseCase(body),
    );

    return { status: 201, body: CreateExtractionPresenter.toHttp(extraction) };
  }
}
