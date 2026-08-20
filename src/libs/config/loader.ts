import type { Config } from "./schema";
import { Value } from "@sinclair/typebox/value";
import { ConfigSchema } from "./schema";

export class ConfigError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Invalid configuration:\n${issues.map((issue) => `  - ${issue}`).join("\n")}`);
    this.name = "ConfigError";
  }
}

export function loadConfig(env: Record<string, string | undefined> = Bun.env): Config {
  const candidate = Value.Convert(ConfigSchema, Value.Default(ConfigSchema, { ...env }));
  const issues = [...Value.Errors(ConfigSchema, candidate)].map(
    (error) => `${error.path || "/"}: ${error.message}`,
  );

  if (issues.length > 0) {
    throw new ConfigError(issues);
  }

  return Object.freeze(candidate as Config);
}
