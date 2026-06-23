import { describe, expect, it } from "bun:test";
import type { ExtractionDeps } from "@/adapters/input/extraction/http/routes";
import { createOutputValidator } from "@/adapters/output/validation/output-validator";
import { buildApp } from "@/cmd/server";
import { fakeProvider } from "../helpers/fake-provider";
import { fakeRepository } from "../helpers/fake-repository";

const validate = createOutputValidator().validate;
const templateJson = JSON.stringify([
	{ name: "title", type: "string", required: true },
	{ name: "amount", type: "number", required: false },
]);

function appWith(extraction: ExtractionDeps) {
	return buildApp({ extraction });
}

function form(fields: Record<string, string>): FormData {
	const fd = new FormData();
	for (const [key, value] of Object.entries(fields)) {
		fd.append(key, value);
	}
	return fd;
}

function post(
	app: ReturnType<typeof buildApp>,
	fields: Record<string, string>,
	query = "",
) {
	return app.handle(
		new Request(`http://localhost/v1/extractions${query}`, {
			method: "POST",
			body: form(fields),
		}),
	);
}

interface ResponseBody {
	data: unknown;
	missingFields: string[];
	complete: boolean;
	meta: { id: string; provider: string };
	status: number;
	title: string;
	errors: { field: string }[];
}

const json = async (res: Response) => (await res.json()) as ResponseBody;

const baseDeps = (data: unknown): ExtractionDeps => ({
	providers: [fakeProvider({ name: "openai", data })],
	order: ["openai"],
	validate,
	repository: fakeRepository(),
});

describe("POST /v1/extractions", () => {
	it("returns 200 with a complete result", async () => {
		const res = await post(appWith(baseDeps({ title: "Milk", amount: 2 })), {
			text: "buy 2 milk",
			template: templateJson,
		});
		expect(res.status).toBe(200);
		const body = await json(res);
		expect(body.complete).toBe(true);
		expect(body.missingFields).toEqual([]);
		expect(body.data).toEqual({ title: "Milk", amount: 2 });
		expect(body.meta.provider).toBe("openai");
		expect(body.meta.id).toBeTruthy();
	});

	it("returns 200 with complete:false when a required field is missing", async () => {
		const res = await post(appWith(baseDeps({ amount: 2 })), {
			text: "buy",
			template: templateJson,
		});
		expect(res.status).toBe(200);
		const body = await json(res);
		expect(body.complete).toBe(false);
		expect(body.missingFields).toEqual(["title"]);
	});

	it("forces a provider via ?provider=", async () => {
		const deps: ExtractionDeps = {
			providers: [
				fakeProvider({ name: "openai", data: { title: "A" } }),
				fakeProvider({ name: "groq", data: { title: "B" } }),
			],
			order: ["openai", "groq"],
			validate,
			repository: fakeRepository(),
		};
		const res = await post(
			appWith(deps),
			{ text: "x", template: templateJson },
			"?provider=groq",
		);
		const body = await json(res);
		expect(body.meta.provider).toBe("groq");
	});

	it("returns 422 problem+json when text is missing", async () => {
		const res = await post(appWith(baseDeps({ title: "x" })), {
			template: templateJson,
		});
		expect(res.status).toBe(422);
		expect(res.headers.get("content-type")).toContain(
			"application/problem+json",
		);
		const body = await json(res);
		expect(body.status).toBe(422);
		expect(body.errors.some((e: { field: string }) => e.field === "text")).toBe(
			true,
		);
	});

	it("returns 422 when the template is not valid JSON", async () => {
		const res = await post(appWith(baseDeps({})), {
			text: "x",
			template: "{not json",
		});
		expect(res.status).toBe(422);
	});

	it("returns 422 for a semantically invalid template", async () => {
		const res = await post(appWith(baseDeps({})), {
			text: "x",
			template: JSON.stringify([{ name: "s", type: "enum", required: true }]),
		});
		expect(res.status).toBe(422);
		const body = await json(res);
		expect(body.title).toBe("Invalid template");
	});

	it("returns 502 when a forced provider is unavailable", async () => {
		const deps: ExtractionDeps = {
			providers: [fakeProvider({ name: "groq", available: false })],
			order: ["groq"],
			validate,
			repository: fakeRepository(),
		};
		const res = await post(
			appWith(deps),
			{ text: "x", template: templateJson },
			"?provider=groq",
		);
		expect(res.status).toBe(502);
	});

	it("returns 503 when no provider is available", async () => {
		const deps: ExtractionDeps = {
			providers: [fakeProvider({ name: "openai", available: false })],
			order: ["openai"],
			validate,
			repository: fakeRepository(),
		};
		const res = await post(appWith(deps), {
			text: "x",
			template: templateJson,
		});
		expect(res.status).toBe(503);
	});

	it("returns 502 when the provider fails transiently and is exhausted", async () => {
		const deps: ExtractionDeps = {
			providers: [fakeProvider({ name: "openai", outcomes: ["transient"] })],
			order: ["openai"],
			validate,
			repository: fakeRepository(),
		};
		const res = await post(appWith(deps), {
			text: "x",
			template: templateJson,
		});
		expect(res.status).toBe(502);
	});
});
