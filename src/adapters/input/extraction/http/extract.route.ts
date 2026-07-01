import type {
  ExtractFromTemplateInput,
  ExtractFromTemplateUseCase,
} from "@/domain/extraction/use-cases/extract-from-template";

export class ExtractionRoute {
  constructor(
    private readonly extractFromTemplateUseCase: ExtractFromTemplateUseCase,
  ) {}

  // TODO: route must return an elysia route handler function that can be used in the elysia app
  // TODO: route must accept a middleware function that can be used to validate the request payload and handle errors automatically
  // TODO: route should be a POST request with a multipart/form-data content type
  public async route(): Promise<any> {
    // TODO: define a proper type

    // TODO: define route request payload by using a schema validation library like zod

    const input = {} as ExtractFromTemplateInput;
    const extraction = await this.extractFromTemplateUseCase.execute(input);

    // TODO: define route response payload by using a schema validation library like zod

    // TODO: define a mapper to response payload

    return extraction;
  }
}
