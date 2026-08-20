import type { Static } from "@sinclair/typebox";
import { Type } from "@sinclair/typebox";

export const ConfigSchema = Type.Object({
  APP_ENV: Type.String({ default: "local" }),
  PORT: Type.Number({ default: 3000 }),
  LOG_LEVEL: Type.String({ default: "info" }),
  DATABASE_URL: Type.String(),
  GROQ_API_KEY: Type.String(),
  GEMINI_API_KEY: Type.String(),
});

export type Config = Static<typeof ConfigSchema>;
