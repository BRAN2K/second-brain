import { InvalidProviderOutput } from "@/domain/errors/invalid-provider-output";
import { NoProviderAvailable } from "@/domain/errors/no-provider-available";
import { ProviderError } from "@/domain/errors/provider-error";
import { TemplateInvalid } from "@/domain/errors/template-invalid";
import { TranscriptionFailed } from "@/domain/errors/transcription-failed";
import { TranscriptionUnavailable } from "@/domain/errors/transcription-unavailable";
import type { ExtractionResult } from "@/domain/use-cases/extract-information";
import type { FieldError } from "./validations";

/** RFC 9457 Problem Details (`application/problem+json`) with a field-level extension. */
export interface ProblemDetails {
	type: string;
	title: string;
	status: number;
	detail?: string;
	instance?: string;
	errors?: FieldError[];
}

export const PROBLEM_CONTENT_TYPE = "application/problem+json";

/** Success envelope for a (possibly incomplete) extraction — always HTTP 200. */
export function presentSuccess(result: ExtractionResult) {
	return {
		data: result.data,
		missingFields: result.missingFields,
		complete: result.complete,
		meta: { id: result.id, ...result.meta },
	};
}

function problem(
	status: number,
	title: string,
	instance: string,
	extra: Partial<ProblemDetails> = {},
): ProblemDetails {
	return { type: "about:blank", title, status, instance, ...extra };
}

/** Builds the 422 Problem Details for request/template validation failures. */
export function presentValidationError(
	errors: FieldError[],
	instance: string,
): ProblemDetails {
	return problem(422, "Invalid request", instance, {
		detail: "The request or template failed validation.",
		errors,
	});
}

/** Builds the 413 Problem Details when the audio upload exceeds the cap. */
export function presentPayloadTooLarge(
	maxBytes: number,
	instance: string,
): ProblemDetails {
	return problem(413, "Audio too large", instance, {
		detail: `Audio exceeds the ${Math.round(maxBytes / (1024 * 1024))} MB limit.`,
	});
}

/**
 * Maps a domain error thrown by the use-case to Problem Details + status:
 * - `TemplateInvalid` → 422 (with per-issue `errors[]`)
 * - `TranscriptionUnavailable` → 503
 * - `NoProviderAvailable` → 502 when a provider was forced, else 503
 * - `ProviderError` / `InvalidProviderOutput` / `TranscriptionFailed` → 502
 * - anything else → 500
 */
export function presentError(error: unknown, instance: string): ProblemDetails {
	if (error instanceof TemplateInvalid) {
		return problem(422, "Invalid template", instance, {
			detail: "The template is not valid for extraction.",
			errors: error.issues.map((message) => ({ field: "template", message })),
		});
	}
	if (error instanceof TranscriptionUnavailable) {
		return problem(503, "Transcription unavailable", instance, {
			detail: error.message,
		});
	}
	if (error instanceof TranscriptionFailed) {
		return problem(502, "Transcription failed", instance, {
			detail: error.message,
		});
	}
	if (error instanceof NoProviderAvailable) {
		return error.forced
			? problem(502, "Forced provider unavailable", instance, {
					detail: error.message,
				})
			: problem(503, "No provider available", instance, {
					detail: error.message,
				});
	}
	if (
		error instanceof ProviderError ||
		error instanceof InvalidProviderOutput
	) {
		return problem(502, "Extraction provider failed", instance, {
			detail: error.message,
		});
	}
	return problem(500, "Internal Server Error", instance, {
		detail: "Unexpected error.",
	});
}
