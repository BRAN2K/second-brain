import { Elysia } from "elysia";
import { createExtractionRequestSchema } from "./request";
import { createExtractionResponseSchema } from "./response";

export const createExtractionSchemas = new Elysia({ name: "create-extraction-schemas" }).model({
  "extraction.create.request": createExtractionRequestSchema,
  "extraction.create.response": createExtractionResponseSchema,
});
