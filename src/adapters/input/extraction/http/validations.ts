import { type Static, Type } from "@sinclair/typebox";

/**
 * Shape validation for the template a caller sends, run at the HTTP edge (TypeBox).
 * This guards the *structure* (types, required keys, no unknown keys); semantic
 * rules — enum needs values, array needs items, unique names — live in the domain
 * service `template-to-schema`, which stays the source of truth.
 */

const LeafTypeSchema = Type.Union([
	Type.Literal("string"),
	Type.Literal("number"),
	Type.Literal("boolean"),
	Type.Literal("date"),
	Type.Literal("enum"),
]);

const FieldTypeSchema = Type.Union([
	Type.Literal("string"),
	Type.Literal("number"),
	Type.Literal("boolean"),
	Type.Literal("date"),
	Type.Literal("enum"),
	Type.Literal("array"),
]);

const ItemsSchema = Type.Object(
	{
		type: LeafTypeSchema,
		values: Type.Optional(Type.Array(Type.String())),
	},
	{ additionalProperties: false },
);

export const TemplateFieldSchema = Type.Object(
	{
		name: Type.String({ minLength: 1 }),
		type: FieldTypeSchema,
		required: Type.Boolean(),
		description: Type.Optional(Type.String()),
		values: Type.Optional(Type.Array(Type.String())),
		items: Type.Optional(ItemsSchema),
	},
	{ additionalProperties: false },
);

export const TemplateInputSchema = Type.Array(TemplateFieldSchema, {
	minItems: 1,
});

export type TemplateInput = Static<typeof TemplateInputSchema>;
