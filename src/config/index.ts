import { type Static, Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

/**
 * Single source of truth for runtime configuration.
 * Env vars are the only input; this module validates and coerces them, and the
 * app reads config exclusively through the typed object returned by `loadConfig`.
 * Extended per PR (DATABASE_URL, provider keys, etc.).
 */
export const ConfigSchema = Type.Object({
	APP_ENV: Type.Union([Type.Literal("local"), Type.Literal("prod")], {
		default: "local",
	}),
	PORT: Type.Integer({ minimum: 1, maximum: 65535, default: 3000 }),
	LOG_LEVEL: Type.Union(
		(["fatal", "error", "warn", "info", "debug", "trace"] as const).map(
			(level) => Type.Literal(level),
		),
		{ default: "info" },
	),
	DATABASE_URL: Type.String({ minLength: 1 }),
});

export type Config = Static<typeof ConfigSchema>;

export class ConfigError extends Error {
	constructor(public readonly issues: string[]) {
		super(
			`Invalid configuration:\n${issues.map((issue) => `  - ${issue}`).join("\n")}`,
		);
		this.name = "ConfigError";
	}
}

/**
 * Validates the environment and returns a frozen, typed config object.
 * Throws `ConfigError` (fail-fast) so misconfiguration surfaces at boot, never
 * mid-request. Extra env vars are ignored.
 */
export function loadConfig(
	env: Record<string, string | undefined> = Bun.env,
): Config {
	const candidate = Value.Convert(
		ConfigSchema,
		Value.Default(ConfigSchema, { ...env }),
	);

	if (!Value.Check(ConfigSchema, candidate)) {
		const issues = [...Value.Errors(ConfigSchema, candidate)].map(
			(error) => `${error.path || "/"}: ${error.message}`,
		);
		throw new ConfigError(issues);
	}

	return Object.freeze(candidate as Config);
}
