import { afterEach, describe, expect, it, mock } from "bun:test";
import { TemplateSnapshot } from "@/domain/extraction/value-objects/template-snapshot.value-object";
import { TemplateFieldKind } from "@/domain/template/enums/template-field-kind.enum";
import { UpstreamError } from "@/libs/errors";
import { makeTemplate } from "@/test/factories/domain/template.aggregate.factory";
import { GROQ_BASE_URL, GROQ_MODEL } from "./constants";
import { GroqExtractionService } from "./groq-extraction.service";

const originalFetch = globalThis.fetch;

function mockFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  const fetchMock = mock(handler);
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function buildSnapshot(): TemplateSnapshot {
  return TemplateSnapshot.fromTemplate(
    makeTemplate({
      items: [
        { name: "produto", kind: TemplateFieldKind.String, required: true },
        { name: "quantidade", kind: TemplateFieldKind.Number, required: true },
        { name: "data", kind: TemplateFieldKind.Date, required: true },
        {
          name: "forma_pagamento",
          kind: TemplateFieldKind.Enum,
          required: false,
          values: ["pix", "dinheiro"],
        },
      ],
    }),
  );
}

describe("GroqExtractionService", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("posts a strict json_schema request and returns the mapped result", async () => {
    const fetchMock = mockFetch(() =>
      Response.json({
        model: GROQ_MODEL,
        choices: [
          {
            message: {
              content: JSON.stringify({
                produto: "aspirador",
                quantidade: 1,
                data: "2026-07-05T00:00:00Z",
                forma_pagamento: null,
              }),
            },
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5 },
      }),
    );

    const result = await new GroqExtractionService("api-key").extract({
      content: "comprei um aspirador",
      template: buildSnapshot(),
    });

    expect(result.provider).toBe("groq");
    expect(result.data).toEqual({
      produto: "aspirador",
      quantidade: 1,
      data: "2026-07-05T00:00:00Z",
      forma_pagamento: null,
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(GROQ_BASE_URL);

    const body = JSON.parse(init.body as string);
    expect(body.model).toBe(GROQ_MODEL);
    expect(body.response_format.json_schema.strict).toBe(true);
    expect(body.response_format.json_schema.schema).toEqual({
      type: "object",
      properties: {
        produto: { type: ["string", "null"] },
        quantidade: { type: ["number", "null"] },
        data: { type: ["string", "null"], description: "ISO 8601 date-time in UTC" },
        forma_pagamento: { type: ["string", "null"], enum: ["pix", "dinheiro", null] },
      },
      required: ["produto", "quantidade", "data", "forma_pagamento"],
      additionalProperties: false,
    });
  });

  it("maps HTTP failures to UpstreamError", async () => {
    mockFetch(() => new Response("bad request", { status: 400 }));

    const error = await new GroqExtractionService("api-key")
      .extract({ content: "texto", template: buildSnapshot() })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(UpstreamError);
    expect((error as UpstreamError).message).toContain("groq");
  });
});
