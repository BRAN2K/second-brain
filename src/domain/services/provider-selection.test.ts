import { describe, expect, it } from "bun:test";
import { fakeProvider } from "@test/helpers/fake-provider";
import { NoProviderAvailable } from "@/domain/errors/no-provider-available";
import { ProviderError } from "@/domain/errors/provider-error";
import type { ExtractionInput } from "@/domain/ports/extraction-provider";
import { selectAndExtract } from "@/domain/services/provider-selection";
import type { CanonicalSchema } from "@/domain/services/template-to-schema";

const schema: CanonicalSchema = {
	type: "object",
	properties: {},
	required: [],
	additionalProperties: false,
};
const input: ExtractionInput = { content: "hello", schema };

const order = ["openai", "gemini", "groq"];

describe("selectAndExtract — order (no forced provider)", () => {
	it("uses the first available provider in order", async () => {
		const openai = fakeProvider({ name: "openai" });
		const gemini = fakeProvider({ name: "gemini" });
		const result = await selectAndExtract([gemini, openai], input, { order });

		expect(result.provider).toBe("openai");
		expect(result.fallbackUsed).toBe(false);
		expect(openai.calls).toBe(1);
		expect(gemini.calls).toBe(0);
	});

	it("skips unavailable providers", async () => {
		const openai = fakeProvider({ name: "openai", available: false });
		const gemini = fakeProvider({ name: "gemini" });
		const result = await selectAndExtract([openai, gemini], input, { order });

		expect(result.provider).toBe("gemini");
		expect(openai.calls).toBe(0);
	});

	it("falls back to the next provider on a transient failure", async () => {
		const openai = fakeProvider({ name: "openai", outcomes: ["transient"] });
		const gemini = fakeProvider({ name: "gemini" });
		const result = await selectAndExtract([openai, gemini], input, { order });

		expect(result.provider).toBe("gemini");
		expect(result.fallbackUsed).toBe(true);
		expect(openai.calls).toBe(2); // initial + 1 retry before falling back
		expect(gemini.calls).toBe(1);
	});

	it("retries once then succeeds on the same provider", async () => {
		const openai = fakeProvider({
			name: "openai",
			outcomes: ["transient", "ok"],
		});
		const result = await selectAndExtract([openai], input, { order });

		expect(result.provider).toBe("openai");
		expect(result.fallbackUsed).toBe(false);
		expect(openai.calls).toBe(2);
	});

	it("does NOT fall back on a permanent failure", async () => {
		const openai = fakeProvider({ name: "openai", outcomes: ["permanent"] });
		const gemini = fakeProvider({ name: "gemini" });

		await expect(
			selectAndExtract([openai, gemini], input, { order }),
		).rejects.toBeInstanceOf(ProviderError);
		expect(openai.calls).toBe(1); // no retry on permanent
		expect(gemini.calls).toBe(0); // no fallback on permanent
	});

	it("throws the last ProviderError when all providers fail transiently", async () => {
		const openai = fakeProvider({ name: "openai", outcomes: ["transient"] });
		const gemini = fakeProvider({ name: "gemini", outcomes: ["transient"] });

		await expect(
			selectAndExtract([openai, gemini], input, { order }),
		).rejects.toBeInstanceOf(ProviderError);
		expect(openai.calls).toBe(2);
		expect(gemini.calls).toBe(2);
	});

	it("throws NoProviderAvailable when none are available", async () => {
		const openai = fakeProvider({ name: "openai", available: false });

		await expect(
			selectAndExtract([openai], input, { order }),
		).rejects.toBeInstanceOf(NoProviderAvailable);
	});
});

describe("selectAndExtract — forced provider", () => {
	it("uses the forced provider directly", async () => {
		const openai = fakeProvider({ name: "openai" });
		const groq = fakeProvider({ name: "groq" });
		const result = await selectAndExtract([openai, groq], input, {
			order,
			forced: "groq",
		});

		expect(result.provider).toBe("groq");
		expect(openai.calls).toBe(0);
	});

	it("retries once on transient but never falls back", async () => {
		const groq = fakeProvider({
			name: "groq",
			outcomes: ["transient", "ok"],
		});
		const openai = fakeProvider({ name: "openai" });
		const result = await selectAndExtract([openai, groq], input, {
			order,
			forced: "groq",
		});

		expect(result.provider).toBe("groq");
		expect(groq.calls).toBe(2);
		expect(openai.calls).toBe(0); // no fallback when forced
	});

	it("throws NoProviderAvailable when the forced provider is unavailable", async () => {
		const groq = fakeProvider({ name: "groq", available: false });
		const openai = fakeProvider({ name: "openai" });

		const promise = selectAndExtract([openai, groq], input, {
			order,
			forced: "groq",
		});
		await expect(promise).rejects.toBeInstanceOf(NoProviderAvailable);
		expect(openai.calls).toBe(0); // does not silently switch
	});

	it("throws NoProviderAvailable when the forced provider is unknown", async () => {
		const openai = fakeProvider({ name: "openai" });
		await expect(
			selectAndExtract([openai], input, { order, forced: "mistral" }),
		).rejects.toBeInstanceOf(NoProviderAvailable);
	});
});
