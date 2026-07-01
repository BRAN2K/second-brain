import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import type { Kysely } from "kysely";
import type { ExtractionDeps } from "@/adapters/input/extraction/http/extract.route";
import { KyselyExtractionRepository } from "@/adapters/output/database/extraction-repository";
import type { Database } from "@/adapters/output/database/types";
import { createOutputValidator } from "@/adapters/output/validation/output-validator";
import { ExtractionSourceType } from "@/domain/extraction/enums/extraction-source-type";
import { buildApp } from "@/infrastructure/container/server";
import { fakeProvider } from "../helpers/fake-provider";
import { fakeTranscriber } from "../helpers/fake-transcriber";
import { setupTestDb } from "../helpers/test-db";

/**
 * End-to-end HTTP → use-case → real Postgres. Uses a fake provider (no LLM calls) but
 * the real Kysely repository, so it proves the full wiring and that result/template/meta
 * round-trip through jsonb columns (id is domain-minted UUID v7, timestamps DB-managed).
 */
let db: Kysely<Database>;
let deps: ExtractionDeps;

beforeAll(async () => {
  db = await setupTestDb();
  deps = {
    provider: fakeProvider({
      name: "openai",
      data: { title: "Green tea", amount: 3 },
    }),
    validate: createOutputValidator().validate,
    repository: new KyselyExtractionRepository(db),
    transcriber: fakeTranscriber(),
  };
}, 60_000);

afterAll(async () => {
  await db?.destroy();
});

describe("POST /v1/extractions (real DB)", () => {
  it("persists the extraction and returns a domain-minted id", async () => {
    const app = buildApp({ extraction: deps });
    const template = JSON.stringify([
      { name: "title", type: "string", required: true },
      { name: "amount", type: "number", required: false },
    ]);
    const fd = new FormData();
    fd.append("text", "buy 3 boxes of green tea");
    fd.append("template", template);

    const res = await app.handle(
      new Request("http://localhost/v1/extractions", {
        method: "POST",
        body: fd,
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      complete: boolean;
      data: unknown;
      meta: { id: string; provider: string };
    };
    expect(body.complete).toBe(true);
    expect(body.data).toEqual({ title: "Green tea", amount: 3 });

    // The row exists in Postgres with the same id and round-tripped jsonb.
    const repository = new KyselyExtractionRepository(db);
    const saved = await repository.findById(body.meta.id);
    expect(saved).not.toBeNull();
    expect(saved?.result).toEqual({ title: "Green tea", amount: 3 });
    expect(saved?.provider).toBe("openai");
    expect(saved?.complete).toBe(true);
    expect(saved?.sourceType).toBe(ExtractionSourceType.Text);
  });
});
