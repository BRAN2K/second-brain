import type { CreateExtractionUseCase } from "@/application/extraction/use-cases/create-extraction.use-case";
import { Elysia } from "elysia";
import { httpErrorSchemas } from "@/libs/errors";
import { toResponse } from "./mapper";
import { routeConfig } from "./route";
import { createExtractionSchemas } from "./schemas";

export class CreateExtractionController {
  constructor(private readonly createExtractionUseCase: CreateExtractionUseCase) {}

  public execute() {
    return new Elysia()
      .use(httpErrorSchemas)
      .use(createExtractionSchemas)
      .post(
        "/extractions",
        async ({ body, status }) => {
          const extraction = await this.createExtractionUseCase.execute(body);

          return status(201, toResponse(extraction));
        },
        routeConfig,
      );
  }
}
