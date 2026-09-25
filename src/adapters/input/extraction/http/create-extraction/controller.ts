import type { CreateExtractionUseCase } from "@/application/extraction/use-cases/create-extraction.use-case";
import { Elysia } from "elysia";
import { httpErrorSchemas } from "@/libs/errors";
import { toResponse } from "./mapper";
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
        {
          body: "extraction.create.request",
          response: {
            201: "extraction.create.response",
            400: "error",
            404: "error",
            422: "error",
            500: "error",
          },
          detail: {
            summary: "Create an extraction",
            description: "Extracts structured data from text or an audio file using a template.",
            tags: ["Extractions"],
          },
        },
      );
  }
}
