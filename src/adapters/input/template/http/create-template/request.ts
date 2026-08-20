import type { Static } from "elysia";
import { t } from "elysia";
import { TemplateFieldKind } from "@/domain/template/enums/template-field-kind";

const baseItemProps = {
  name: t.String(),
  required: t.Boolean(),
  rules: t.Optional(t.Array(t.String())),
  description: t.Optional(t.String()),
};

export const templateItemSchema = t.Union([
  t.Object({
    ...baseItemProps,
    kind: t.Literal(TemplateFieldKind.String),
    default: t.Optional(t.String()),
  }),
  t.Object({
    ...baseItemProps,
    kind: t.Literal(TemplateFieldKind.Number),
    default: t.Optional(t.Number()),
  }),
  t.Object({
    ...baseItemProps,
    kind: t.Literal(TemplateFieldKind.Boolean),
    default: t.Optional(t.Boolean()),
  }),
  t.Object({
    ...baseItemProps,
    kind: t.Literal(TemplateFieldKind.Date),
    default: t.Optional(t.String()),
  }),
  t.Object({
    ...baseItemProps,
    kind: t.Literal(TemplateFieldKind.Enum),
    default: t.Optional(t.String()),
    values: t.Array(t.String()),
  }),
]);

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
