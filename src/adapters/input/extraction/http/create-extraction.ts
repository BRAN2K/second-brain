import { Elysia } from "elysia";
import type {
  CreateExtractionInput,
  CreateExtractionUseCase,
} from "@/domain/extraction/use-cases/create-extraction";

export class CreateExtractionController {
  constructor(private readonly createExtractionUseCase: CreateExtractionUseCase) {}

  public execute() {
    return new Elysia().post("/extractions", async () => {
      const input = {} as CreateExtractionInput;
      const extraction = await this.createExtractionUseCase.execute(input);

      return extraction;
    });
  }
}
