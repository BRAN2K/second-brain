import { afterEach, describe, expect, it } from "bun:test";
import { createGeminiProvider } from "@/adapters/output/llm/gemini-provider";
import {
	createLlmProviders,
	parseProviderOrder,
} from "@/adapters/output/llm/index";
import { createOpenAiCompatibleProvider } from "@/adapters/output/llm/openai-compatible-provider";
import { ProviderError } from "@/domain/errors/provider-error";
import type { ExtractionInput } from "@/domain/ports/extraction-provider";
import { templateToSchema } from "@/domain/services/template-to-schema";

const { schema } = templateToSchema([
	{ name: "title", type: "string", required: true },
]);
const input: ExtractionInput = { content: "Buy milk", schema };

const realFetch = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = realFetch;
});

interface Captured {
	url: string;
	init?: RequestInit;
}

function mockFetch(status: number, body: unknown, captured?: Captured): void {
	globalThis.fetch = ((url: string, init?: RequestInit) => {
		if (captured) {
			captured.url = String(url);
			captured.init = init;
		}
		return Promise.resolve(
			new Response(typeof body === "string" ? body : JSON.stringify(body), {
				status,
			}),
		);
	}) as unknown as typeof fetch;
}

function failFetch(): void {
	globalThis.fetch = (() =>
		Promise.reject(new Error("network down"))) as unknown as typeof fetch;
}

const openai = createOpenAiCompatibleProvider({
	name: "openai",
	baseURL: "https://api.openai.com/v1",
	apiKey: "sk-test",
	model: "gpt-4o-mini",
});

describe("openai-compatible provider", () => {
	it("reports availability from the API key", () => {
		expect(openai.isAvailable()).toBe(true);
		const noKey = createOpenAiCompatibleProvider({
			name: "groq",
			baseURL: "x",
			apiKey: undefined,
			model: "m",
		});
		expect(noKey.isAvailable()).toBe(false);
	});

	it("posts a chat-completions request and parses data + raw meta", async () => {
		const captured: Captured = { url: "" };
		mockFetch(
			200,
			{
				model: "gpt-4o-mini-2024",
				choices: [{ message: { content: JSON.stringify({ title: "Milk" }) } }],
				usage: { prompt_tokens: 11, completion_tokens: 3 },
			},
			captured,
		);

		const result = await openai.extract(input);

		expect(captured.url).toBe("https://api.openai.com/v1/chat/completions");
		const sent = JSON.parse(String(captured.init?.body));
		expect(sent.model).toBe("gpt-4o-mini");
		expect(sent.response_format).toEqual({ type: "json_object" });
		expect(sent.messages[1]).toEqual({ role: "user", content: "Buy milk" });

		expect(result.data).toEqual({ title: "Milk" });
		expect(result.raw.model).toBe("gpt-4o-mini-2024");
		expect(result.raw.inputTokens).toBe(11);
		expect(result.raw.outputTokens).toBe(3);
		expect(result.raw.latencyMs).toBeGreaterThanOrEqual(0);
	});

	it("throws a transient ProviderError on a 5xx", async () => {
		mockFetch(503, "unavailable");
		await expect(openai.extract(input)).rejects.toMatchObject({
			name: "ProviderError",
			transient: true,
		});
	});

	it("throws a permanent ProviderError on a 400", async () => {
		mockFetch(400, "bad request");
		await expect(openai.extract(input)).rejects.toMatchObject({
			transient: false,
		});
	});

	it("treats a network failure as transient", async () => {
		failFetch();
		await expect(openai.extract(input)).rejects.toMatchObject({
			transient: true,
		});
	});

	it("treats non-JSON content as a permanent failure", async () => {
		mockFetch(200, {
			choices: [{ message: { content: "not json at all" } }],
		});
		await expect(openai.extract(input)).rejects.toMatchObject({
			transient: false,
		});
	});
});

const gemini = createGeminiProvider({
	apiKey: "g-test",
	model: "gemini-2.0-flash",
});

describe("gemini provider", () => {
	it("posts generateContent with a responseSchema and parses the result", async () => {
		const captured: Captured = { url: "" };
		mockFetch(
			200,
			{
				candidates: [
					{ content: { parts: [{ text: JSON.stringify({ title: "Eggs" }) }] } },
				],
				usageMetadata: { promptTokenCount: 7, candidatesTokenCount: 2 },
			},
			captured,
		);

		const result = await gemini.extract(input);

		expect(captured.url).toContain("/models/gemini-2.0-flash:generateContent");
		const sent = JSON.parse(String(captured.init?.body));
		expect(sent.generationConfig.responseMimeType).toBe("application/json");
		expect(sent.generationConfig.responseSchema.type).toBe("OBJECT");

		expect(result.data).toEqual({ title: "Eggs" });
		expect(result.raw.model).toBe("gemini-2.0-flash");
		expect(result.raw.inputTokens).toBe(7);
	});

	it("throws a transient ProviderError on a 429", async () => {
		mockFetch(429, "rate limited");
		await expect(gemini.extract(input)).rejects.toBeInstanceOf(ProviderError);
	});
});

describe("createLlmProviders + parseProviderOrder", () => {
	it("builds the three providers with availability from keys", () => {
		const providers = createLlmProviders({
			OPENAI_API_KEY: "sk",
			GROQ_API_KEY: undefined,
			GEMINI_API_KEY: undefined,
			OPENAI_MODEL: "gpt-4o-mini",
			GROQ_MODEL: "llama",
			GEMINI_MODEL: "gemini-2.0-flash",
		} as never);

		expect(providers.map((p) => p.name)).toEqual(["openai", "groq", "gemini"]);
		expect(providers.find((p) => p.name === "openai")?.isAvailable()).toBe(
			true,
		);
		expect(providers.find((p) => p.name === "groq")?.isAvailable()).toBe(false);
	});

	it("parses a comma-separated order, trimming blanks", () => {
		expect(parseProviderOrder(" groq , openai ,, gemini ")).toEqual([
			"groq",
			"openai",
			"gemini",
		]);
	});
});
