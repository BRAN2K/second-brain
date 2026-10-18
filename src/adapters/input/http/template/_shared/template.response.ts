import type { Static } from "elysia";
import { t } from "elysia";
import { templateItemSchema } from "./template-item.schema";

export const templateResponseSchema = t.Object(
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

export type TemplateResponse = Static<typeof templateResponseSchema>;
