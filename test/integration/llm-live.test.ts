import { describe, expect, it } from "bun:test";
import { createLlmRegistry } from "@/adapters/output/llm/index";
import { createOutputValidator } from "@/adapters/output/validation/output-validator";
import { loadConfig } from "@/infrastructure/config";
import { findMissingFields } from "@/domain/services/missing-fields";
import { templateToSchema } from "@/domain/services/template-to-schema";

/**
 * Opt-in live smoke test — hits the real provider APIs. Skipped unless `LLM_LIVE=1`
 * (so it never runs in CI / normal `bun test`). Only providers whose API key is set
 * are exercised. Does NOT touch the database.
 *
 *   LLM_LIVE=1 GROQ_API_KEY=... bun run test:integration
 */
const live = process.env.LLM_LIVE === "1";
const suite = live ? describe : describe.skip;

suite("LLM live extraction", () => {
	const config = loadConfig(Bun.env);
	const registry = createLlmRegistry(config);
	const validator = createOutputValidator();

	const { schema, required } = templateToSchema([
		{ name: "item", type: "string", required: true },
		{ name: "quantity", type: "number", required: false },
	]);
	const content = "Please buy 3 boxes of green tea.";

	const available = registry.available();
	if (available.length === 0) {
		it("has at least one provider key configured", () => {
			throw new Error("LLM_LIVE=1 but no provider API key is set");
		});
	}

	for (const provider of available) {
		it(`${provider.name} returns schema-valid data`, async () => {
			const output = await provider.extract({ content, schema });
			const result = validator.validate(schema, output.data);
			expect(result.valid).toBe(true);
			// "item" should be extractable from the prompt above.
			expect(findMissingFields(required, result.data)).toEqual([]);
			expect(output.raw.model).toBeTruthy();
		}, 30_000);
	}
});
