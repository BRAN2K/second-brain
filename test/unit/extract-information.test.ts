import { describe, expect, it } from "bun:test";
import { createOutputValidator } from "@/adapters/output/validation/output-validator";
import type { Template } from "@/domain/entities/template";
import { InvalidProviderOutput } from "@/domain/errors/invalid-provider-output";
import { NoProviderAvailable } from "@/domain/errors/no-provider-available";
import { TemplateInvalid } from "@/domain/errors/template-invalid";
import {
	type ExtractInformationDeps,
	extractInformation,
} from "@/domain/use-cases/extract-information";
import { fakeProvider } from "../helpers/fake-provider";
import { fakeRepository } from "../helpers/fake-repository";

const validate = createOutputValidator().validate;
const order = ["openai", "groq"];

const template: Template = [
	{ name: "title", type: "string", required: true },
	{ name: "amount", type: "number", required: false },
];

function deps(
	overrides: Partial<ExtractInformationDeps> = {},
): ExtractInformationDeps {
	return {
		providers: [fakeProvider({ name: "openai", data: { title: "Hi" } })],
		order,
		validate,
		repository: fakeRepository(),
		...overrides,
	};
}

describe("extractInformation", () => {
	it("returns a complete result and persists it", async () => {
		const repository = fakeRepository();
		const result = await extractInformation(
			deps({
				providers: [
					fakeProvider({ name: "openai", data: { title: "Hi", amount: 5 } }),
				],
				repository,
			}),
			{ text: "buy", template },
		);

		expect(result.complete).toBe(true);
		expect(result.missingFields).toEqual([]);
		expect(result.data).toEqual({ title: "Hi", amount: 5 });
		expect(result.meta.provider).toBe("openai");
		expect(repository.saved).toHaveLength(1);
		expect(repository.saved[0].id).toBe(result.id);
		expect(repository.saved[0].complete).toBe(true);
		expect(repository.saved[0].meta.fallbackUsed).toBe(false);
	});

	it("reports missing required fields but still succeeds (200-style)", async () => {
		const result = await extractInformation(
			deps({
				providers: [fakeProvider({ name: "openai", data: { amount: 5 } })],
			}),
			{ text: "buy", template },
		);
		expect(result.complete).toBe(false);
		expect(result.missingFields).toEqual(["title"]);
	});

	it("strips hallucinated keys via the validator before persisting", async () => {
		const result = await extractInformation(
			deps({
				providers: [
					fakeProvider({ name: "openai", data: { title: "Hi", extra: "x" } }),
				],
			}),
			{ text: "buy", template },
		);
		expect(result.data).toEqual({ title: "Hi" });
	});

	it("honors a forced provider", async () => {
		const result = await extractInformation(
			deps({
				providers: [
					fakeProvider({ name: "openai", data: { title: "A" } }),
					fakeProvider({ name: "groq", data: { title: "B" } }),
				],
			}),
			{ text: "buy", template, forced: "groq" },
		);
		expect(result.meta.provider).toBe("groq");
		expect(result.data).toEqual({ title: "B" });
	});

	it("throws TemplateInvalid for a semantically broken template", async () => {
		await expect(
			extractInformation(deps(), {
				text: "buy",
				template: [{ name: "s", type: "enum", required: true }],
			}),
		).rejects.toBeInstanceOf(TemplateInvalid);
	});

	it("throws NoProviderAvailable when none are available", async () => {
		await expect(
			extractInformation(
				deps({
					providers: [fakeProvider({ name: "openai", available: false })],
				}),
				{ text: "buy", template },
			),
		).rejects.toBeInstanceOf(NoProviderAvailable);
	});

	it("throws InvalidProviderOutput when output has the wrong type", async () => {
		await expect(
			extractInformation(
				deps({
					providers: [
						fakeProvider({ name: "openai", data: { amount: "not a number" } }),
					],
				}),
				{ text: "buy", template },
			),
		).rejects.toBeInstanceOf(InvalidProviderOutput);
	});
});
