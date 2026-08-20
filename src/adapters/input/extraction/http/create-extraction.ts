import type {
  CreateExtractionInput,
  CreateExtractionUseCase,
} from "@/application/extraction/use-cases/create-extraction.use-case";
import { Elysia } from "elysia";

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
