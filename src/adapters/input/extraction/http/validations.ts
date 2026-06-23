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

/** Synchronous audio cap (ADR 0006): larger uploads are rejected with 413. */
export const MAX_AUDIO_BYTES = 24 * 1024 * 1024;

/** Either raw text or an uploaded audio file — exactly one (text XOR audio). */
export type RequestSource =
	| { kind: "text"; text: string }
	| { kind: "audio"; file: Blob; filename: string };

export interface ParsedExtractionRequest {
	source: RequestSource;
	template: TemplateInput;
	instructions?: string;
}

export type ParseResult =
	| { ok: true; value: ParsedExtractionRequest }
	| { ok: false; errors: FieldError[] };

function parseTemplate(
	raw: unknown,
	errors: FieldError[],
): TemplateInput | undefined {
	let parsed: unknown;
	if (raw === undefined || raw === null) {
		errors.push({
			field: "template",
			message: "template is required (a JSON-encoded field list)",
		});
		return undefined;
	}
	if (typeof raw === "string") {
		// Only reaches here when Elysia could not auto-parse it (i.e. invalid JSON).
		try {
			parsed = JSON.parse(raw);
		} catch {
			errors.push({ field: "template", message: "template is not valid JSON" });
			return undefined;
		}
	} else {
		parsed = raw; // already parsed by Elysia
	}

	if (Value.Check(TemplateInputSchema, parsed)) {
		return parsed;
	}
	for (const issue of Value.Errors(TemplateInputSchema, parsed)) {
		errors.push({ field: `template${issue.path}`, message: issue.message });
	}
	return undefined;
}

/**
 * Validates a multipart extraction request: **text XOR audio** (exactly one), `template`
 * (a field list sent as JSON), optional `instructions`. Elysia auto-parses multipart
 * fields that look like JSON, so `template` arrives already parsed when valid and as a raw
 * string otherwise — both are handled. Returns field-level errors instead of throwing so
 * the route can render one Problem Details response. The 24 MB audio cap (413) and
 * semantic template checks (enum needs values, etc.) are enforced elsewhere.
 */
export function parseExtractionRequest(body: unknown): ParseResult {
	const errors: FieldError[] = [];
	const record = (body ?? {}) as Record<string, unknown>;

	const text =
		typeof record.text === "string" && record.text.trim() !== ""
			? record.text
			: undefined;
	const audio = record.audio instanceof Blob ? record.audio : undefined;

	if (text && audio) {
		errors.push({
			field: "text",
			message: "provide either text or audio, not both",
		});
	} else if (!text && !audio) {
		errors.push({
			field: "text",
			message: "one of text or audio is required",
		});
	}

	const instructions =
		typeof record.instructions === "string" ? record.instructions : undefined;
	const template = parseTemplate(record.template, errors);

	if (errors.length > 0 || !template) {
		return { ok: false, errors };
	}

	const source: RequestSource = audio
		? {
				kind: "audio",
				file: audio,
				filename: audio instanceof File ? audio.name : "audio",
			}
		: { kind: "text", text: text as string };

	return { ok: true, value: { source, template, instructions } };
}
