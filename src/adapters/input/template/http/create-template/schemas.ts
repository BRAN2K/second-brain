import { Elysia } from "elysia";
import { createTemplateRequestSchema } from "./request";
import { createTemplateResponseSchema } from "./response";

export const createTemplateSchemas = new Elysia({ name: "create-template-schemas" }).model({
  "template.create.request": createTemplateRequestSchema,
  "template.create.response": createTemplateResponseSchema,
});
