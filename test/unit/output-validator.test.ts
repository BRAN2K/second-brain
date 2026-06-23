import { describe, expect, it } from "bun:test";
import { createOutputValidator } from "@/adapters/output/validation/output-validator";
import { templateToSchema } from "@/domain/services/template-to-schema";

const validator = createOutputValidator();

// Build a canonical schema from a template (the real upstream of this service).
const { schema } = templateToSchema([
	{ name: "title", type: "string", required: true },
	{ name: "amount", type: "number", required: false },
	{ name: "status", type: "enum", required: false, values: ["open", "done"] },
	{ name: "tags", type: "array", required: false, items: { type: "string" } },
]);

describe("createOutputValidator (lenient)", () => {
	it("accepts well-typed complete output", () => {
		const result = validator.validate(schema, {
			title: "Hi",
			amount: 10,
			status: "open",
			tags: ["a", "b"],
		});
		expect(result.valid).toBe(true);
		expect(result.errors).toEqual([]);
	});

	it("does NOT reject missing fields (incomplete is valid)", () => {
		const result = validator.validate(schema, { title: "Hi" });
		expect(result.valid).toBe(true);
	});

	it("does NOT reject null fields (incomplete is valid)", () => {
		const result = validator.validate(schema, {
			title: null,
			amount: null,
			status: null,
			tags: null,
		});
		expect(result.valid).toBe(true);
	});

	it("rejects a wrong type (real structural error)", () => {
		const result = validator.validate(schema, { amount: "not a number" });
		expect(result.valid).toBe(false);
		expect(result.errors.length).toBeGreaterThan(0);
	});

	it("rejects an out-of-enum value", () => {
		const result = validator.validate(schema, { status: "archived" });
		expect(result.valid).toBe(false);
	});

	it("strips keys the template never asked for", () => {
		const result = validator.validate(schema, {
			title: "Hi",
			hallucinated: "remove me",
		});
		expect(result.valid).toBe(true);
		expect(result.data).toEqual({ title: "Hi" });
	});

	it("does not mutate the input object", () => {
		const input = { title: "Hi", extra: 1 };
		validator.validate(schema, input);
		expect(input).toEqual({ title: "Hi", extra: 1 });
	});

	it("accepts an empty object (everything absent)", () => {
		expect(validator.validate(schema, {}).valid).toBe(true);
	});
});
