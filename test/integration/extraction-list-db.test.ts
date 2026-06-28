import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import type { Kysely } from "kysely";
import { KyselyExtractionRepository } from "@/adapters/output/database/extraction-repository";
import type { Database } from "@/adapters/output/database/types";
import type {
  Extraction,
  NewExtraction,
} from "@/domain/extraction/entities/extraction";
import { setupTestDb } from "../helpers/test-db";

/**
 * Cursor pagination + soft-delete exclusion against real Postgres (UUIDv7 ordering).
 * The test DB is shared across files, so we assert on our own seeded ids only.
 */
let db: Kysely<Database>;
let repository: KyselyExtractionRepository;

const newExtraction = (text: string): NewExtraction => ({
  sourceType: "text",
  inputText: text,
  template: [{ name: "title", type: "string", required: true }],
  result: { title: text },
  complete: true,
});

beforeAll(async () => {
  db = await setupTestDb();
  repository = new KyselyExtractionRepository(db);
}, 60_000);

afterAll(async () => {
  await db?.destroy();
});

describe("KyselyExtractionRepository.list", () => {
  it("paginates newest-first by UUIDv7 and excludes soft-deleted rows", async () => {
    const saved: Extraction[] = [];
    for (const text of ["a", "b", "c", "d"]) {
      saved.push(await repository.save(newExtraction(text)));
    }
    const mine = new Set(saved.map((e) => e.id));
    const ours = (rows: Extraction[]) =>
      rows.filter((e) => mine.has(e.id)).map((e) => e.inputText);

    // Newest-first ordering among our rows (d, c, b, a).
    expect(ours(await repository.list({ limit: 100 }))).toEqual([
      "d",
      "c",
      "b",
      "a",
    ]);

    // Cursor = id of "c" returns only strictly-older rows (b, a).
    const cId = saved[2].id;
    expect(ours(await repository.list({ cursor: cId, limit: 100 }))).toEqual([
      "b",
      "a",
    ]);

    // Soft-delete "c" → it disappears from the listing.
    await repository.softDelete(cId);
    const after = await repository.list({ limit: 100 });
    expect(ours(after)).toEqual(["d", "b", "a"]);
    expect(after.some((e) => e.id === cId)).toBe(false);
  });

  it("respects the limit", async () => {
    const page = await repository.list({ limit: 1 });
    expect(page).toHaveLength(1);
  });
});
