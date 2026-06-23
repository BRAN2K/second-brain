import type { Extraction } from "@/domain/entities/extraction";
import type { Template } from "@/domain/entities/template";
import { InvalidProviderOutput } from "@/domain/errors/invalid-provider-output";
import type { ExtractionProvider } from "@/domain/ports/extraction-provider";
import type { ExtractionRepository } from "@/domain/ports/extraction-repository";
import { findMissingFields } from "@/domain/services/missing-fields";
import { selectAndExtract } from "@/domain/services/provider-selection";
import {
	type CanonicalSchema,
	templateToSchema,
} from "@/domain/services/template-to-schema";

/**
 * The text-extraction use-case: orchestrates the pure domain services and the injected
 * adapters end to end — template → schema → provider selection/fallback → lenient
 * validation → missingFields → persist. Framework-free: the validator is injected as a
 * plain function so the domain never imports the Ajv adapter.
 */

/** Lenient structural validation, injected (matches the validation adapter's shape). */
export type ValidateOutput = (
	schema: CanonicalSchema,
	data: unknown,
) => { valid: boolean; data: unknown; errors: string[] };

export interface ExtractInformationDeps {
	/** All known providers; availability + order govern selection. */
	providers: ExtractionProvider[];
	order: string[];
	validate: ValidateOutput;
	repository: ExtractionRepository;
}

export interface ExtractInformationInput {
	text: string;
	template: Template;
	instructions?: string;
	/** Forced provider from `?provider=`; disables fallback when set. */
	forced?: string;
}

export interface ExtractionResult {
	id: string;
	data: unknown;
	missingFields: string[];
	complete: boolean;
	meta: {
		provider: string;
		model: string;
		fallbackUsed: boolean;
		latencyMs: number;
		inputTokens?: number;
		outputTokens?: number;
	};
}

export async function extractInformation(
	deps: ExtractInformationDeps,
	input: ExtractInformationInput,
): Promise<ExtractionResult> {
	// Throws TemplateInvalid (→422) on a semantically broken template.
	const { schema, required } = templateToSchema(input.template);

	// Throws NoProviderAvailable (→502/503) or ProviderError (→502).
	const selection = await selectAndExtract(
		deps.providers,
		{ content: input.text, schema, instructions: input.instructions },
		{ forced: input.forced, order: deps.order },
	);

	const validation = deps.validate(schema, selection.data);
	if (!validation.valid) {
		throw new InvalidProviderOutput(selection.provider, validation.errors);
	}

	const missingFields = findMissingFields(required, validation.data);
	const complete = missingFields.length === 0;

	const saved: Extraction = await deps.repository.save({
		sourceType: "text",
		inputText: input.text,
		template: input.template,
		result: validation.data,
		missingFields,
		complete,
		provider: selection.provider,
		model: selection.raw.model,
		meta: {
			fallbackUsed: selection.fallbackUsed,
			latencyMs: selection.raw.latencyMs,
			inputTokens: selection.raw.inputTokens,
			outputTokens: selection.raw.outputTokens,
		},
	});

	return {
		id: saved.id,
		data: validation.data,
		missingFields,
		complete,
		meta: {
			provider: selection.provider,
			model: selection.raw.model,
			fallbackUsed: selection.fallbackUsed,
			latencyMs: selection.raw.latencyMs,
			inputTokens: selection.raw.inputTokens,
			outputTokens: selection.raw.outputTokens,
		},
	};
}
