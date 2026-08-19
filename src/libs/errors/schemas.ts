import { Elysia } from "elysia";
import { errorSchema } from "./schema";

export const httpErrorSchemas = new Elysia({ name: "http-error-schemas" }).model({
  error: errorSchema,
});
