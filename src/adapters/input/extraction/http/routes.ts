import { Elysia } from "elysia";
import {
	type ExtractInformationDeps,
	extractInformation,
} from "@/domain/use-cases/extract-information";
import type { Metrics } from "@/infrastructure/metrics";
import {
	PROBLEM_CONTENT_TYPE,
	presentError,
	presentExtraction,
	presentList,
	presentNotFound,
	presentPayloadTooLarge,
	presentSuccess,
	presentValidationError,
} from "./presenters";
import {
	MAX_AUDIO_BYTES,
	parseExtractionRequest,
	parsePagination,
} from "./validations";

export interface ExtractionDeps extends ExtractInformationDeps {
	/** Optional Prometheus recorder; when set, extraction outcomes are counted. */
	metrics?: Metrics;
}

const INSTANCE = "/v1/extractions";

/**
 * Extraction input adapter. `POST /v1/extractions` accepts `multipart/form-data` with
 * **text XOR audio**, a JSON-encoded `template`, and optional `instructions`; `?provider=`
 * forces the extraction provider. Audio over 24 MB is rejected with 413. Incomplete
 * results are 200 with `complete:false`; failures are RFC 9457 Problem Details.
 *
 * Read endpoints: `GET /v1/extractions/:id` (404 when missing/soft-deleted) and
 * `GET /v1/extractions` (newest-first, cursor-based pagination by UUIDv7).
 */
export function extractionRoutes(deps: ExtractionDeps) {
	return new Elysia()
		.post(`${INSTANCE}`, async ({ body, query, set }) => {
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
				return problemResponse(
					presentPayloadTooLarge(MAX_AUDIO_BYTES, INSTANCE),
				);
			}

			try {
				const result = await extractInformation(deps, {
					source,
					template: parsed.value.template,
					instructions: parsed.value.instructions,
					forced:
						typeof query.provider === "string" ? query.provider : undefined,
				});
				deps.metrics?.recordExtraction({
					provider: result.meta.provider,
					complete: result.complete,
					fallbackUsed: result.meta.fallbackUsed,
					inputTokens: result.meta.inputTokens,
					outputTokens: result.meta.outputTokens,
				});
				return presentSuccess(result);
			} catch (error) {
				const problem = presentError(error, INSTANCE);
				if (problem.status >= 500) {
					deps.metrics?.recordError(
						error instanceof Error ? error.name : "Unknown",
					);
				}
				return problemResponse(problem);
			}
		})
		.get(`${INSTANCE}/:id`, async ({ params, set }) => {
			const extraction = await deps.repository.findById(params.id);
			if (!extraction) {
				set.status = 404;
				set.headers["content-type"] = PROBLEM_CONTENT_TYPE;
				return presentNotFound(`${INSTANCE}/${params.id}`);
			}
			return presentExtraction(extraction);
		})
		.get(`${INSTANCE}`, async ({ query, set }) => {
			const pagination = parsePagination(query as Record<string, unknown>);
			if (!pagination.ok) {
				set.status = 422;
				set.headers["content-type"] = PROBLEM_CONTENT_TYPE;
				return presentValidationError(pagination.errors, INSTANCE);
			}

			const { cursor, limit } = pagination.value;
			const items = await deps.repository.list({ cursor, limit });
			// A full page implies there may be more; the last id is the next cursor.
			const nextCursor =
				items.length === limit ? items[items.length - 1].id : null;
			return presentList(items, nextCursor);
		});
}
