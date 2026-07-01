import { ProviderError } from "@/domain/extraction/errors/provider-error";
import type {
  ExtractionInput,
  ExtractionOutput,
  ExtractionProvider,
} from "@/domain/extraction/ports/http/extraction-provider";

export class geminiExtractionProvider implements ExtractionProvider {
  constructor(
    private readonly geminiApiKey: string,
    private readonly geminiModel: string,
    private readonly geminiUrl: string,
  ) {}

  async extract(input: ExtractionInput): Promise<ExtractionOutput> {
    const systemPrompt = "";

    let response: Response;
    try {
      response = await fetch(
        `${this.geminiUrl}/models/${this.geminiModel}:generateContent`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-goog-api-key": this.geminiApiKey,
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts: [{ text: input.content }] }],
            generationConfig: {
              temperature: 0,
              responseMimeType: "application/json",
              responseSchema: {}, //TODO: define schema
            },
          }),
        },
      );
    } catch (cause) {
      throw new ProviderError("gemini", true, { cause });
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`gemini: ${response.status} - ${body}`); //TODO: handle errors properly
    }

    return {
      data: await response.json(), //TODO: parse data properly
      raw: {
        model: this.geminiModel,
        inputTokens: 0, //TODO: calculate input tokens
        outputTokens: 0, //TODO: calculate output tokens
      },
    };
  }
}
