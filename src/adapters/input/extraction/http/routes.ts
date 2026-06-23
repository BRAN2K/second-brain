import { Elysia } from "elysia";
import {
	type ExtractInformationDeps,
	extractInformation,
} from "@/domain/use-cases/extract-information";
import {
	PROBLEM_CONTENT_TYPE,
	presentError,
	presentPayloadTooLarge,
	presentSuccess,
	presentValidationError,
} from "./presenters";
import { MAX_AUDIO_BYTES, parseExtractionRequest } from "./validations";

export type ExtractionDeps = ExtractInformationDeps;

const INSTANCE = "/v1/extractions";

/**
 * Extraction input adapter. `POST /v1/extractions` accepts `multipart/form-data` with
 * **text XOR audio**, a JSON-encoded `template`, and optional `instructions`; `?provider=`
 * forces the extraction provider. Audio over 24 MB is rejected with 413. Incomplete
 * results are 200 with `complete:false`; failures are RFC 9457 Problem Details.
 */
export function extractionRoutes(deps: ExtractionDeps) {
	return new Elysia().post(`${INSTANCE}`, async ({ body, query, set }) => {
		const problemResponse = (problem: { status: number }) => {
			set.status = problem.status;
			set.headers["content-type"] = PROBLEM_CONTENT_TYPE;
			return problem;
		};

		const parsed = parseExtractionRequest(body);
		if (!parsed.ok) {
			return problemResponse(presentValidationError(parsed.errors, INSTANCE));
		}

		const { source } = parsed.value;
		if (source.kind === "audio" && source.file.size > MAX_AUDIO_BYTES) {
			return problemResponse(presentPayloadTooLarge(MAX_AUDIO_BYTES, INSTANCE));
		}

		try {
			const result = await extractInformation(deps, {
				source,
				template: parsed.value.template,
				instructions: parsed.value.instructions,
				forced: typeof query.provider === "string" ? query.provider : undefined,
			});
			return presentSuccess(result);
		} catch (error) {
			return problemResponse(presentError(error, INSTANCE));
		}
	});
}
