import type { Static } from "elysia";
import { t } from "elysia";
import { templateResponseSchema } from "../_shared/template.response";

export const listTemplatesResponseSchema = t.Object(
  {
    items: t.Array(templateResponseSchema),
    nextCursor: t.Union([t.String(), t.Null()], {
      description: "Cursor to fetch the next page, null when there is none",
    }),
  },
  { description: "A page of extraction templates" },
);

export type ListTemplatesResponse = Static<typeof listTemplatesResponseSchema>;
