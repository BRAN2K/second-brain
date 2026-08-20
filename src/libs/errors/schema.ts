import type { Static } from "elysia";
import { t } from "elysia";

export const errorSchema = t.Object(
  {
    brn: t.String({ examples: ["brn:second-brain:template:not-found"] }),
    message: t.String(),
    issues: t.Optional(t.Array(t.String())),
  },
  { description: "Error response" },
);

export type ErrorBody = Static<typeof errorSchema>;
