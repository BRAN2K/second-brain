import { afterEach, describe, expect, it, mock } from "bun:test";
import { GeminiExtractionLLMProvider } from "@/adapters/output/llm/gemini/gemini-provider";
import { toGeminiRequest } from "@/adapters/output/llm/gemini/mappers/request-mapper";
import { toExtractionResult } from "@/adapters/output/llm/gemini/mappers/response-mapper";
import { buildSnapshot, geminiPayload } from "@/adapters/output/llm/gemini/test-fixtures";
import { ProviderError } from "@/domain/extraction/errors/provider-error";

const originalFetch = globalThis.fetch;

function mockFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  const fetchMock = mock(handler);
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function buildProvider(): GeminiExtractionLLMProvider {
  return new GeminiExtractionLLMProvider("api-key", "gemini-2.5-flash", "https://gemini.test/v1");
}

describe("GeminiExtractionLLMProvider", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("posts the mapped request and returns the mapped response", async () => {
    const payload = geminiPayload();
    const fetchMock = mockFetch(() => new Response(JSON.stringify(payload)));
    const input = {
      content: "comprei um aspirador ontem no pix",
      template: buildSnapshot(),
      instructions: "considere valores em reais",
    };

    const result = await buildProvider().extract(input);

    expect(result).toEqual(toExtractionResult(payload));

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://gemini.test/v1/models/gemini-2.5-flash:generateContent");
    expect(JSON.parse(init.body as string)).toEqual(
      JSON.parse(JSON.stringify(toGeminiRequest(input))),
    );
  });

  it("maps HTTP failures to ProviderError", async () => {
    mockFetch(() => new Response("rate limited", { status: 429 }));

    const error = await buildProvider()
      .extract({ content: "texto", template: buildSnapshot() })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ProviderError);
    expect((error as ProviderError).provider).toBe("gemini");
  });

  it("maps network failures to ProviderError", async () => {
    mockFetch(() => {
      throw new Error("connection refused");
    });

    const error = await buildProvider()
      .extract({ content: "texto", template: buildSnapshot() })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ProviderError);
    expect((error as ProviderError).provider).toBe("gemini");
  });
});
