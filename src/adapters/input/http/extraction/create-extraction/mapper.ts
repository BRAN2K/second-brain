import type { CreateExtractionInput } from "@/application/use-cases/extraction/dtos/create-extraction.dto";
import type { CreateExtractionRequest } from "./request";

export const CreateExtractionMapper = {
  toUseCase(body: CreateExtractionRequest): CreateExtractionInput {
    return {
      sourceType: body.sourceType,
      templateId: body.templateId,
      inputText: body.inputText,
      file: body.file,
      instructions: body.instructions,
    };
  },
};
