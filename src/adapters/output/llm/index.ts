import type { ExtractionProvider } from "@/domain/extraction/ports/http/extraction-provider";
import type { Config } from "@/infrastructure/config";
import { createGeminiProvider } from "./gemini-provider";
import { createOpenAiCompatibleProvider } from "./openai-compatible-provider";
import { createProviderRegistry, type ProviderRegistry } from "./registry";

export type { ProviderRegistry } from "./registry";
export { createProviderRegistry } from "./registry";

/** Instantiates every known provider; availability is decided by each one's API key. */
export function createLlmProviders(config: Config): ExtractionProvider[] {
  return [
    createOpenAiCompatibleProvider({
      name: "openai",
      baseURL: "https://api.openai.com/v1",
      apiKey: config.OPENAI_API_KEY,
      model: config.OPENAI_MODEL,
    }),
    createOpenAiCompatibleProvider({
      name: "groq",
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: config.GROQ_API_KEY,
      model: config.GROQ_MODEL,
    }),
    createGeminiProvider({
      apiKey: config.GEMINI_API_KEY,
      model: config.GEMINI_MODEL,
    }),
  ];
}

/** Parses the comma-separated `PROVIDER_ORDER` into a clean name list. */
export function parseProviderOrder(raw: string): string[] {
  return raw
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

/** Builds the provider registry wired from config (used at the composition root). */
export function createLlmRegistry(config: Config): ProviderRegistry {
  return createProviderRegistry(
    createLlmProviders(config),
    parseProviderOrder(config.PROVIDER_ORDER),
  );
}
