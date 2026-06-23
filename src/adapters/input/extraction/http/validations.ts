import { type Static, Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

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

/** Field-level error, surfaced in the RFC 9457 `errors[]` member. */
export interface FieldError {
	field: string;
	message: string;
}

export interface ParsedExtractionRequest {
	text: string;
	template: TemplateInput;
	instructions?: string;
}

export type ParseResult =
	| { ok: true; value: ParsedExtractionRequest }
	| { ok: false; errors: FieldError[] };

/**
 * Validates a multipart extraction request: `text` (non-empty), `template` (a field
 * list, sent as a JSON string), optional `instructions`. Note Elysia auto-parses
 * multipart fields that look like JSON, so `template` arrives already parsed when valid
 * and as a raw string otherwise — we handle both. Returns field-level errors instead of
 * throwing so the route can render one Problem Details response. Semantic template checks
 * (enum needs values, etc.) stay in the domain converter.
 */
export function parseExtractionRequest(body: unknown): ParseResult {
	const errors: FieldError[] = [];
	const record = (body ?? {}) as Record<string, unknown>;

	const text = typeof record.text === "string" ? record.text : undefined;
	if (text === undefined || text.trim() === "") {
		errors.push({ field: "text", message: "text is required and non-empty" });
	}

	const instructions =
		typeof record.instructions === "string" ? record.instructions : undefined;

	let template: TemplateInput | undefined;
	const rawTemplate = record.template;
	let parsed: unknown;
	if (rawTemplate === undefined || rawTemplate === null) {
		errors.push({
			field: "template",
			message: "template is required (a JSON-encoded field list)",
		});
	} else if (typeof rawTemplate === "string") {
		// Only reaches here when Elysia could not auto-parse it (i.e. invalid JSON).
		try {
			parsed = JSON.parse(rawTemplate);
		} catch {
			errors.push({ field: "template", message: "template is not valid JSON" });
		}
	} else {
		parsed = rawTemplate; // already parsed by Elysia
	}

	if (parsed !== undefined) {
		if (Value.Check(TemplateInputSchema, parsed)) {
			template = parsed;
		} else {
			for (const issue of Value.Errors(TemplateInputSchema, parsed)) {
				errors.push({
					field: `template${issue.path}`,
					message: issue.message,
				});
			}
		}
	}

	if (errors.length > 0 || !template || text === undefined) {
		return { ok: false, errors };
	}
	return { ok: true, value: { text, template, instructions } };
}
