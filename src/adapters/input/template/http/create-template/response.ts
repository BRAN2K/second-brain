import { type Static, t } from "elysia";
import { templateItemSchema } from "./request";

export const createTemplateResponseSchema = t.Object(
  {
    id: t.String(),
    name: t.String(),
    description: t.String(),
    items: t.Array(templateItemSchema),
    rules: t.Array(t.String()),
    createdAt: t.String(),
    updatedAt: t.String(),
  },
  { description: "An extraction template" },
);

export type CreateTemplateResponse = Static<typeof createTemplateResponseSchema>;
