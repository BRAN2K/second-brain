import { beforeAll, describe, expect, it } from "bun:test";
import { fakeProvider } from "@test/helpers/fake-provider";
import {
  type FakeRepository,
  fakeRepository,
} from "@test/helpers/fake-repository";
import { fakeTranscriber } from "@test/helpers/fake-transcriber";
import type { ExtractionDeps } from "@/adapters/input/extraction/http/routes";
import { createOutputValidator } from "@/adapters/output/validation/output-validator";
import type { NewExtraction } from "@/domain/extraction/entities/extraction";
import { buildApp } from "@/infrastructure/container/server";

const repository: FakeRepository = fakeRepository();
const deps: ExtractionDeps = {
  providers: [fakeProvider({ name: "openai" })],
  order: ["openai"],
  validate: createOutputValidator().validate,
  repository,
  transcriber: fakeTranscriber(),
};
const app = buildApp({ extraction: deps });

const seed = (text: string): Promise<unknown> => {
  const input: NewExtraction = {
    sourceType: "text",
    inputText: text,
    template: [{ name: "title", type: "string", required: true }],
    result: { title: text },
    complete: true,
  };
  return repository.save(input);
};

const get = (path: string) =>
  app.handle(new Request(`http://localhost${path}`));

let firstId: string;

beforeAll(async () => {
  // Saved in order → ascending ids; list returns them newest-first.
  for (const text of ["one", "two", "three"]) {
    await seed(text);
  }
  firstId = repository.saved[0].id;
});

describe("GET /v1/extractions/:id", () => {
  it("returns 200 with the stored extraction", async () => {
    const res = await get(`/v1/extractions/${firstId}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; inputText: string };
    expect(body.id).toBe(firstId);
    expect(body.inputText).toBe("one");
  });

  it("returns 404 problem+json for an unknown id", async () => {
    const res = await get(
      "/v1/extractions/00000000-0000-7000-8000-999999999999",
    );
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toContain(
      "application/problem+json",
    );
  });
});

describe("GET /v1/extractions (pagination)", () => {
  it("returns newest-first items with a nextCursor when the page is full", async () => {
    const res = await get("/v1/extractions?limit=2");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: { inputText: string; id: string }[];
      nextCursor: string | null;
    };
    expect(body.items.map((i) => i.inputText)).toEqual(["three", "two"]);
    expect(body.nextCursor).toBe(body.items[1].id);
  });

  it("walks to the next page via the cursor and ends with nextCursor null", async () => {
    const first = (await (await get("/v1/extractions?limit=2")).json()) as {
      nextCursor: string;
    };
    const res = await get(`/v1/extractions?limit=2&cursor=${first.nextCursor}`);
    const body = (await res.json()) as {
      items: { inputText: string }[];
      nextCursor: string | null;
    };
    expect(body.items.map((i) => i.inputText)).toEqual(["one"]);
    expect(body.nextCursor).toBeNull();
  });

  it("defaults the limit and returns everything when it fits", async () => {
    const res = await get("/v1/extractions");
    const body = (await res.json()) as { items: unknown[]; nextCursor: null };
    expect(body.items).toHaveLength(3);
    expect(body.nextCursor).toBeNull();
  });

  it("returns 422 for an out-of-range limit", async () => {
    expect((await get("/v1/extractions?limit=0")).status).toBe(422);
    expect((await get("/v1/extractions?limit=999")).status).toBe(422);
    expect((await get("/v1/extractions?limit=abc")).status).toBe(422);
  });

  it("returns 422 for a malformed cursor", async () => {
    expect((await get("/v1/extractions?cursor=not-a-uuid")).status).toBe(422);
  });
});
