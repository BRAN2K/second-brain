import { t } from "elysia";
import { TemplateFieldKind } from "@/domain/template/enums/template-field-kind.enum";

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
