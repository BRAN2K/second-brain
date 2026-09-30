import type { Static } from "elysia";
import { t } from "elysia";
import { templateItemSchema } from "../_shared/template-item.schema";

export const createTemplateRequestSchema = t.Object(
  {
    name: t.String(),
    description: t.String({ description: "What this template extracts, shown to the LLM" }),
    items: t.Array(templateItemSchema, { description: "Fields the extraction must produce" }),
    rules: t.Optional(t.Array(t.String(), { description: "Template-wide extraction rules" })),
  },
  { description: "Payload to create an extraction template" },
);

export type CreateTemplateRequest = Static<typeof createTemplateRequestSchema>;
