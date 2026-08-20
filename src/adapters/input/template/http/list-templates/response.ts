import type { Static } from "elysia";
import { t } from "elysia";
import { templateItemSchema } from "../create-template/request";

const templateSchema = t.Object(
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

export const listTemplatesResponseSchema = t.Object(
  {
    items: t.Array(templateSchema),
    nextCursor: t.Union([t.String(), t.Null()], {
      description: "Cursor to fetch the next page, null when there is none",
    }),
  },
  { description: "A page of extraction templates" },
);

export type ListTemplatesResponse = Static<typeof listTemplatesResponseSchema>;
