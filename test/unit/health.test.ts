import { describe, expect, it } from "bun:test";
import { buildApp } from "@/cmd/server";

describe("health endpoints", () => {
	const app = buildApp();

	it("GET /health returns ok", async () => {
		const res = await app.handle(new Request("http://localhost/health"));
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ status: "ok" });
	});

	it("GET /ready returns ready", async () => {
		const res = await app.handle(new Request("http://localhost/ready"));
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ status: "ready" });
	});
});
