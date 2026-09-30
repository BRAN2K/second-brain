import type { EnvSchema, EnvValues } from "./schema";
import { Value } from "@sinclair/typebox/value";

export class EnvLoader<S extends EnvSchema> {
  private static _instance: EnvLoader<EnvSchema> | undefined;

  private readonly _env: EnvValues<S>;

  private constructor(schema: S) {
    const raw = Value.Convert(schema, { ...process.env });
    const errors = [...Value.Errors(schema, raw)];

    if (errors.length > 0) {
      const issues = errors.map((error) => `${error.path}: ${error.message}`).join("\n");

      throw new Error(`Invalid environment variables:\n${issues}`);
    }

    this._env = Object.freeze(Value.Parse(schema, raw));
  }

  private static getInstance<S extends EnvSchema>(schema: S): EnvLoader<S> {
    if (!EnvLoader._instance) {
      EnvLoader._instance = new EnvLoader(schema) as unknown as EnvLoader<EnvSchema>;
    }

    return EnvLoader._instance as unknown as EnvLoader<S>;
  }

  static load<S extends EnvSchema>(schema: S): EnvValues<S> {
    return EnvLoader.getInstance(schema)._env;
  }
}
