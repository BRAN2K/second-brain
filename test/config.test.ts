import { describe, expect, it } from "bun:test";
import { ConfigError, loadConfig } from "@/config";

describe("loadConfig", () => {
	it("applies defaults when env is empty", () => {
		const config = loadConfig({});
		expect(config.APP_ENV).toBe("local");
		expect(config.PORT).toBe(3000);
		expect(config.LOG_LEVEL).toBe("info");
	});

	it("coerces PORT from a string", () => {
		const config = loadConfig({ PORT: "8080" });
		expect(config.PORT).toBe(8080);
	});

	it("reads a valid APP_ENV", () => {
		expect(loadConfig({ APP_ENV: "prod" }).APP_ENV).toBe("prod");
	});

	it("throws ConfigError on an invalid APP_ENV", () => {
		expect(() => loadConfig({ APP_ENV: "staging" })).toThrow(ConfigError);
	});

	it("throws ConfigError on an out-of-range PORT", () => {
		expect(() => loadConfig({ PORT: "70000" })).toThrow(ConfigError);
	});

	it("ignores unrelated env vars", () => {
		const config = loadConfig({ PATH: "/usr/bin", HOME: "/home/x" });
		expect(config.PORT).toBe(3000);
	});
});
