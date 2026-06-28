import { ProviderName } from "@/domain/extraction/enums/provider-name";
import { ProviderError } from "@/domain/extraction/errors/provider-error";
import type {
  ExtractionInput,
  ExtractionOutput,
  ExtractionProvider,
} from "@/domain/extraction/ports/http/extraction-provider";
import { providerErrorFromStatus } from "./errors";
import { toGeminiSchema } from "./to-provider-schema";

/**
 * Provider for Google Gemini via the REST `generateContent` endpoint. Uses Gemini's
 * native structured output (`responseMimeType: application/json` + `responseSchema`).
 * Output is always re-validated downstream.
 */
export interface GeminiConfig {
  apiKey: string | undefined;
  model: string;
}

interface GenerateContentResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
}

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

export function createGeminiProvider(cfg: GeminiConfig): ExtractionProvider {
  return {
    name: ProviderName.Gemini,
    isAvailable: () => Boolean(cfg.apiKey),

    async extract(input: ExtractionInput): Promise<ExtractionOutput> {
      const start = Date.now();
      const system = [
        "You extract structured data from the user's text.",
        input.instructions,
      ]
        .filter(Boolean)
        .join("\n\n");

      let response: Response;
      try {
        response = await fetch(
          `${BASE_URL}/models/${cfg.model}:generateContent`,
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-goog-api-key": cfg.apiKey ?? "",
            },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: system }] },
              contents: [{ role: "user", parts: [{ text: input.content }] }],
              generationConfig: {
                temperature: 0,
                responseMimeType: "application/json",
                responseSchema: toGeminiSchema(input.schema),
              },
            }),
          },
        );
      } catch (cause) {
        throw new ProviderError("gemini", true, { cause });
      }

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw providerErrorFromStatus("gemini", response.status, body);
      }

      const json = (await response.json()) as GenerateContentResponse;
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof text !== "string") {
        throw new ProviderError("gemini", false, { cause: "empty completion" });
      }

      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch (cause) {
        throw new ProviderError("gemini", false, { cause });
      }

      return {
        data,
        raw: {
          model: cfg.model,
          latencyMs: Date.now() - start,
          inputTokens: json.usageMetadata?.promptTokenCount,
          outputTokens: json.usageMetadata?.candidatesTokenCount,
        },
      };
    },
  };
}
