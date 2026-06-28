/** The LLM providers known to the system. Adapters use these as their `name`. */
export enum ProviderName {
  OpenAI = "openai",
  Groq = "groq",
  Gemini = "gemini",
}

/** Boundary guard for raw provider-name strings (config/HTTP). */
export function isProviderName(value: string): value is ProviderName {
  return (Object.values(ProviderName) as string[]).includes(value);
}
