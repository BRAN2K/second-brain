import { afterEach, describe, expect, it, mock } from "bun:test";
import { GEMINI_BASE_URL, GEMINI_MODEL } from "@/adapters/output/llm/gemini/constants";
import { GeminiExtractionLLMProvider } from "@/adapters/output/llm/gemini/gemini-provider";
import { toGeminiRequest } from "@/adapters/output/llm/gemini/mappers/request-mapper";
import { toExtractionResult } from "@/adapters/output/llm/gemini/mappers/response-mapper";
import { buildSnapshot, geminiPayload } from "@/adapters/output/llm/gemini/test-fixtures";
import { UpstreamError } from "@/libs/errors";

const originalFetch = globalThis.fetch;

function mockFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  const fetchMock = mock(handler);
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function buildProvider(): GeminiExtractionLLMProvider {
  return new GeminiExtractionLLMProvider("api-key");
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
    expect(url).toBe(`${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent`);
    expect(JSON.parse(init.body as string)).toEqual(
      JSON.parse(JSON.stringify(toGeminiRequest(input))),
    );
  });

  it("maps HTTP failures to UpstreamError", async () => {
    mockFetch(() => new Response("rate limited", { status: 429 }));

    const error = await buildProvider()
      .extract({ content: "texto", template: buildSnapshot() })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(UpstreamError);
    expect((error as UpstreamError).message).toContain("gemini");
  });

  it("maps network failures to UpstreamError", async () => {
    mockFetch(() => {
      throw new Error("connection refused");
    });

    const error = await buildProvider()
      .extract({ content: "texto", template: buildSnapshot() })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(UpstreamError);
    expect((error as UpstreamError).message).toContain("gemini");
  });
});
