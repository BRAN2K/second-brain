import { describe, expect, it } from "bun:test";
import { ConfigError, loadConfig } from "@/config";

// Minimal env that satisfies all required vars; spread per-test to override.
const baseEnv = { DATABASE_URL: "postgres://app:app@localhost:5432/db" };

describe("loadConfig", () => {
	it("applies defaults for optional vars", () => {
		const config = loadConfig({ ...baseEnv });
		expect(config.APP_ENV).toBe("local");
		expect(config.PORT).toBe(3000);
		expect(config.LOG_LEVEL).toBe("info");
	});

	it("coerces PORT from a string", () => {
		const config = loadConfig({ ...baseEnv, PORT: "8080" });
		expect(config.PORT).toBe(8080);
	});

	it("reads a valid APP_ENV", () => {
		expect(loadConfig({ ...baseEnv, APP_ENV: "prod" }).APP_ENV).toBe("prod");
	});

	it("reads DATABASE_URL", () => {
		expect(loadConfig({ ...baseEnv }).DATABASE_URL).toBe(baseEnv.DATABASE_URL);
	});

	it("throws ConfigError when DATABASE_URL is missing", () => {
		expect(() => loadConfig({})).toThrow(ConfigError);
	});

	it("throws ConfigError on an invalid APP_ENV", () => {
		expect(() => loadConfig({ ...baseEnv, APP_ENV: "staging" })).toThrow(
			ConfigError,
		);
	});

	it("throws ConfigError on an out-of-range PORT", () => {
		expect(() => loadConfig({ ...baseEnv, PORT: "70000" })).toThrow(
			ConfigError,
		);
	});

	it("ignores unrelated env vars", () => {
		const config = loadConfig({
			...baseEnv,
			PATH: "/usr/bin",
			HOME: "/home/x",
		});
		expect(config.PORT).toBe(3000);
	});
});
