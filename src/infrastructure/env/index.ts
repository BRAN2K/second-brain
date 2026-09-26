import type { EnvSchema, EnvValues } from "@/libs/env";
import { Type } from "@sinclair/typebox";
import { EnvLoader } from "@/libs/env";

const envSchema = Type.Object({
  ENV: Type.String({ default: "local" }),
  PORT: Type.Number({ default: 3000 }),
  LOG_LEVEL: Type.String({ default: "info" }),
  DATABASE_URL: Type.String(),
  GROQ_API_KEY: Type.String(),
  GEMINI_API_KEY: Type.String(),
}) satisfies EnvSchema;

export type Env = EnvValues<typeof envSchema>;
export const env = EnvLoader.load(envSchema);
