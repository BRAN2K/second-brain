import { ProviderError } from "@/domain/errors/provider-error";
import type {
	ExtractionInput,
	ExtractionOutput,
	ExtractionProvider,
} from "@/domain/ports/extraction-provider";
import { providerErrorFromStatus } from "./errors";
import { schemaInstruction } from "./to-provider-schema";

/**
 * Provider for any OpenAI-compatible Chat Completions endpoint — used for both OpenAI
 * and Groq (same wire format, different base URL/model). Uses `json_object` mode with
 * the schema embedded in the system prompt; output is always re-validated downstream.
 */
export interface OpenAiCompatibleConfig {
	name: string;
	baseURL: string;
	apiKey: string | undefined;
	model: string;
}

interface ChatCompletionResponse {
	model?: string;
	choices?: Array<{ message?: { content?: string } }>;
	usage?: { prompt_tokens?: number; completion_tokens?: number };
}

export function createOpenAiCompatibleProvider(
	cfg: OpenAiCompatibleConfig,
): ExtractionProvider {
	return {
		name: cfg.name,
		isAvailable: () => Boolean(cfg.apiKey),

		async extract(input: ExtractionInput): Promise<ExtractionOutput> {
			const start = Date.now();
			const system = [
				"You extract structured data from the user's text.",
				schemaInstruction(input.schema),
				input.instructions,
			]
				.filter(Boolean)
				.join("\n\n");

			let response: Response;
			try {
				response = await fetch(`${cfg.baseURL}/chat/completions`, {
					method: "POST",
					headers: {
						"content-type": "application/json",
						authorization: `Bearer ${cfg.apiKey}`,
					},
					body: JSON.stringify({
						model: cfg.model,
						temperature: 0,
						response_format: { type: "json_object" },
						messages: [
							{ role: "system", content: system },
							{ role: "user", content: input.content },
						],
					}),
				});
			} catch (cause) {
				// Network/timeout failure — transient, eligible for retry/fallback.
				throw new ProviderError(cfg.name, true, { cause });
			}

			if (!response.ok) {
				const body = await response.text().catch(() => "");
				throw providerErrorFromStatus(cfg.name, response.status, body);
			}

			const json = (await response.json()) as ChatCompletionResponse;
			const content = json.choices?.[0]?.message?.content;
			if (typeof content !== "string") {
				throw new ProviderError(cfg.name, false, { cause: "empty completion" });
			}

			let data: unknown;
			try {
				data = JSON.parse(content);
			} catch (cause) {
				throw new ProviderError(cfg.name, false, { cause });
			}

			return {
				data,
				raw: {
					model: json.model ?? cfg.model,
					latencyMs: Date.now() - start,
					inputTokens: json.usage?.prompt_tokens,
					outputTokens: json.usage?.completion_tokens,
				},
			};
		},
	};
}
