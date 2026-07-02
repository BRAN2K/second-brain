import { Elysia } from "elysia";
import type {
  CreateExtractionInput,
  CreateExtractionUseCase,
} from "@/domain/extraction/use-cases/create-extraction";

export class CreateExtractionController {
  constructor(
    private readonly createExtractionUseCase: CreateExtractionUseCase,
  ) {}

  // TODO: route must accept a middleware function that can be used to validate the request payload and handle errors automatically
  // TODO: route should be a POST request with a multipart/form-data content type
  public execute() {
    return new Elysia().post("/extractions", async () => {
      // TODO: define route request payload by using a schema validation library

      const input = {} as CreateExtractionInput;
      const extraction = await this.createExtractionUseCase.execute(input);

      // TODO: define route response payload by using a schema validation library

      // TODO: define a mapper to response payload

      return extraction;
    });
  }
}
