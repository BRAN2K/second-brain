import { describe, expect, it } from "bun:test";
import { fakeProvider } from "@test/helpers/fake-provider";
import { fakeRepository } from "@test/helpers/fake-repository";
import { fakeTranscriber } from "@test/helpers/fake-transcriber";
import type { ExtractionDeps } from "@/adapters/input/extraction/http/routes";
import { createOutputValidator } from "@/adapters/output/validation/output-validator";
import { buildApp } from "@/infrastructure/container/server";

const validate = createOutputValidator().validate;
const templateJson = JSON.stringify([
	{ name: "title", type: "string", required: true },
	{ name: "amount", type: "number", required: false },
]);

function appWith(extraction: ExtractionDeps) {
	return buildApp({ extraction });
}

function post(
	app: ReturnType<typeof buildApp>,
	fields: Record<string, string | Blob>,
	query = "",
) {
	const fd = new FormData();
	for (const [key, value] of Object.entries(fields)) {
		fd.append(key, value);
	}
	return app.handle(
		new Request(`http://localhost/v1/extractions${query}`, {
			method: "POST",
			body: fd,
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

const deps = (overrides: Partial<ExtractionDeps> = {}): ExtractionDeps => ({
	providers: [
		fakeProvider({ name: "openai", data: { title: "Milk", amount: 2 } }),
	],
	order: ["openai"],
	validate,
	repository: fakeRepository(),
	transcriber: fakeTranscriber(),
	...overrides,
});

describe("POST /v1/extractions — text", () => {
	it("returns 200 with a complete result", async () => {
		const res = await post(appWith(deps()), {
			text: "buy 2 milk",
			template: templateJson,
		});
		expect(res.status).toBe(200);
		const body = await json(res);
		expect(body.complete).toBe(true);
		expect(body.data).toEqual({ title: "Milk", amount: 2 });
		expect(body.meta.provider).toBe("openai");
		expect(body.meta.id).toBeTruthy();
	});

	it("returns 200 with complete:false when a required field is missing", async () => {
		const res = await post(
			appWith(
				deps({
					providers: [fakeProvider({ name: "openai", data: { amount: 2 } })],
				}),
			),
			{ text: "buy", template: templateJson },
		);
		expect(res.status).toBe(200);
		const body = await json(res);
		expect(body.complete).toBe(false);
		expect(body.missingFields).toEqual(["title"]);
	});

	it("forces a provider via ?provider=", async () => {
		const res = await post(
			appWith(
				deps({
					providers: [
						fakeProvider({ name: "openai", data: { title: "A" } }),
						fakeProvider({ name: "groq", data: { title: "B" } }),
					],
					order: ["openai", "groq"],
				}),
			),
			{ text: "x", template: templateJson },
			"?provider=groq",
		);
		expect((await json(res)).meta.provider).toBe("groq");
	});
});

describe("POST /v1/extractions — request validation", () => {
	it("returns 422 problem+json when neither text nor audio is given", async () => {
		const res = await post(appWith(deps()), { template: templateJson });
		expect(res.status).toBe(422);
		expect(res.headers.get("content-type")).toContain(
			"application/problem+json",
		);
	});

	it("returns 422 when both text and audio are given (XOR)", async () => {
		const res = await post(appWith(deps()), {
			text: "x",
			audio: new Blob(["bytes"], { type: "audio/mpeg" }),
			template: templateJson,
		});
		expect(res.status).toBe(422);
	});

	it("returns 422 when the template is not valid JSON", async () => {
		const res = await post(appWith(deps()), {
			text: "x",
			template: "{not json",
		});
		expect(res.status).toBe(422);
	});

	it("returns 422 for a semantically invalid template", async () => {
		const res = await post(appWith(deps()), {
			text: "x",
			template: JSON.stringify([{ name: "s", type: "enum", required: true }]),
		});
		expect(res.status).toBe(422);
		expect((await json(res)).title).toBe("Invalid template");
	});
});

describe("POST /v1/extractions — provider failures", () => {
	it("returns 502 when a forced provider is unavailable", async () => {
		const res = await post(
			appWith(
				deps({
					providers: [fakeProvider({ name: "groq", available: false })],
					order: ["groq"],
				}),
			),
			{ text: "x", template: templateJson },
			"?provider=groq",
		);
		expect(res.status).toBe(502);
	});

	it("returns 503 when no provider is available", async () => {
		const res = await post(
			appWith(
				deps({
					providers: [fakeProvider({ name: "openai", available: false })],
				}),
			),
			{ text: "x", template: templateJson },
		);
		expect(res.status).toBe(503);
	});

	it("returns 502 when the provider fails transiently and is exhausted", async () => {
		const res = await post(
			appWith(
				deps({
					providers: [
						fakeProvider({ name: "openai", outcomes: ["transient"] }),
					],
				}),
			),
			{ text: "x", template: templateJson },
		);
		expect(res.status).toBe(502);
	});
});

describe("POST /v1/extractions — audio", () => {
	it("transcribes audio then extracts (200)", async () => {
		const res = await post(
			appWith(
				deps({
					providers: [fakeProvider({ name: "openai", data: { title: "tea" } })],
					transcriber: fakeTranscriber({ text: "buy tea" }),
				}),
			),
			{
				audio: new Blob(["fake-bytes"], { type: "audio/mpeg" }),
				template: templateJson,
			},
		);
		expect(res.status).toBe(200);
		expect((await json(res)).data).toEqual({ title: "tea" });
	});

	it("returns 503 when audio is sent but transcription is unavailable", async () => {
		const res = await post(
			appWith(deps({ transcriber: fakeTranscriber({ available: false }) })),
			{
				audio: new Blob(["fake-bytes"], { type: "audio/mpeg" }),
				template: templateJson,
			},
		);
		expect(res.status).toBe(503);
	});

	it("returns 413 when the audio exceeds the size cap", async () => {
		const big = new Blob([new Uint8Array(24 * 1024 * 1024 + 1)], {
			type: "audio/mpeg",
		});
		const res = await post(appWith(deps()), {
			audio: big,
			template: templateJson,
		});
		expect(res.status).toBe(413);
	});
});
