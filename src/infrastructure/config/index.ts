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

  // LLM providers. Keys are optional and may be absent OR empty (e.g. a blank line
  // from .env.example): a provider is "available" only when its key is a non-empty
  // string, so the app runs with any subset configured. Order is tried when no
  // provider is forced (cheapest/most reliable first).
  OPENAI_API_KEY: Type.Optional(Type.String()),
  GROQ_API_KEY: Type.Optional(Type.String()),
  GEMINI_API_KEY: Type.Optional(Type.String()),
  PROVIDER_ORDER: Type.String({ default: "groq,openai,gemini" }),
  OPENAI_MODEL: Type.String({ default: "gpt-4o-mini" }),
  GROQ_MODEL: Type.String({ default: "llama-3.3-70b-versatile" }),
  GEMINI_MODEL: Type.String({ default: "gemini-2.0-flash" }),
  // Speech-to-text (audio): uses GROQ_API_KEY; available only when that key is set.
  GROQ_WHISPER_MODEL: Type.String({ default: "whisper-large-v3-turbo" }),
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
