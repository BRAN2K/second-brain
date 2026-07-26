import { type Static, t } from "elysia";

export const listTemplatesRequestSchema = t.Object(
  {
    cursor: t.Optional(t.String({ description: "Cursor returned by a previous page" })),
    limit: t.Optional(
      t.Numeric({
        minimum: 1,
        maximum: 100,
        description: "Max templates to return (default 20, max 100)",
      }),
    ),
  },
  { description: "Query params to paginate templates" },
);

export type ListTemplatesRequest = Static<typeof listTemplatesRequestSchema>;
