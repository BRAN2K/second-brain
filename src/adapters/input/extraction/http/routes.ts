import { Elysia } from "elysia";
import {
	type ExtractInformationDeps,
	extractInformation,
} from "@/domain/use-cases/extract-information";
import {
	PROBLEM_CONTENT_TYPE,
	presentError,
	presentSuccess,
	presentValidationError,
} from "./presenters";
import { parseExtractionRequest } from "./validations";

export type ExtractionDeps = ExtractInformationDeps;

const INSTANCE = "/v1/extractions";

/**
 * Extraction input adapter. `POST /v1/extractions` accepts `multipart/form-data` with
 * `text`, a JSON-encoded `template`, and optional `instructions`; `?provider=` forces a
 * provider. Incomplete results are 200 with `complete:false`; failures are RFC 9457
 * Problem Details. (Audio + text-XOR-audio land in PR7.)
 */
export function extractionRoutes(deps: ExtractionDeps) {
	return new Elysia().post(`${INSTANCE}`, async ({ body, query, set }) => {
		const parsed = parseExtractionRequest(body);
		if (!parsed.ok) {
			set.status = 422;
			set.headers["content-type"] = PROBLEM_CONTENT_TYPE;
			return presentValidationError(parsed.errors, INSTANCE);
		}

		try {
			const result = await extractInformation(deps, {
				text: parsed.value.text,
				template: parsed.value.template,
				instructions: parsed.value.instructions,
				forced: typeof query.provider === "string" ? query.provider : undefined,
			});
			return presentSuccess(result);
		} catch (error) {
			const problem = presentError(error, INSTANCE);
			set.status = problem.status;
			set.headers["content-type"] = PROBLEM_CONTENT_TYPE;
			return problem;
		}
	});
}
