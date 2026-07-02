import { type Static, Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

// TODO: refactor/simplify this file

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
  OPENAI_API_KEY: Type.String(),
  GROQ_API_KEY: Type.String(),
  GEMINI_API_KEY: Type.String(),
  PROVIDER_ORDER: Type.String({ default: "groq,openai,gemini" }),
  OPENAI_MODEL: Type.String({ default: "gpt-4o-mini" }),
  GROQ_MODEL: Type.String({ default: "llama-3.3-70b-versatile" }),
  GEMINI_MODEL: Type.String({ default: "gemini-2.0-flash" }),
  GEMINI_URL: Type.String({
    default: "https://generativelanguage.googleapis.com/v1beta",
  }),
  GROQ_WHISPER_MODEL: Type.String({ default: "whisper-large-v3-turbo" }),
  GROQ_WHISPER_URL: Type.String({
    default: "https://api.groq.com/openai/v1/audio/transcriptions",
  }),
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
