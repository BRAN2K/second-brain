import { Elysia } from "elysia";
import { listTemplatesRequestSchema } from "./request";
import { listTemplatesResponseSchema } from "./response";

export const listTemplatesSchemas = new Elysia({ name: "list-templates-schemas" }).model({
  "template.list.request": listTemplatesRequestSchema,
  "template.list.response": listTemplatesResponseSchema,
});
