import { describe, expect, it } from "bun:test";
import { Value } from "@sinclair/typebox/value";
import { TemplateInputSchema } from "@/adapters/input/extraction/http/validations";

const check = (value: unknown) => Value.Check(TemplateInputSchema, value);

describe("TemplateInputSchema (HTTP edge shape validation)", () => {
	it("accepts a well-formed template", () => {
		expect(
			check([
				{ name: "title", type: "string", required: true },
				{
					name: "tags",
					type: "array",
					required: false,
					items: { type: "string" },
				},
			]),
		).toBe(true);
	});

	it("rejects an empty array", () => {
		expect(check([])).toBe(false);
	});

	it("rejects an unknown field type", () => {
		expect(check([{ name: "x", type: "object", required: true }])).toBe(false);
	});

	it("rejects a missing required key", () => {
		expect(check([{ name: "x", type: "string" }])).toBe(false);
	});

	it("rejects a blank name", () => {
		expect(check([{ name: "", type: "string", required: true }])).toBe(false);
	});

	it("rejects unknown keys on a field", () => {
		expect(
			check([{ name: "x", type: "string", required: true, extra: 1 }]),
		).toBe(false);
	});

	it("rejects a non-string in values", () => {
		expect(
			check([{ name: "x", type: "enum", required: true, values: [1, 2] }]),
		).toBe(false);
	});
});
