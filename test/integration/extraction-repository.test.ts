import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import type { Kysely } from "kysely";
import { KyselyExtractionRepository } from "@/adapters/output/database/extraction-repository";
import type { Database } from "@/adapters/output/database/types";
import { setupTestDb } from "../helpers/test-db";

let db: Kysely<Database>;
let repo: KyselyExtractionRepository;

beforeAll(async () => {
	db = await setupTestDb();
	repo = new KyselyExtractionRepository(db);
}, 60_000);

afterAll(async () => {
	await db?.destroy();
});

const UUIDV7 =
	/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("KyselyExtractionRepository (integration)", () => {
	it("saves with DB-generated id (uuidv7), timestamps, and defaults", async () => {
		const template = [{ name: "title", type: "string", required: true }];
		const e = await repo.save({
			sourceType: "text",
			inputText: "hello world",
			template,
		});

		expect(e.id).toMatch(UUIDV7);
		expect(e.createdAt).toBeInstanceOf(Date);
		expect(e.updatedAt).toBeInstanceOf(Date);
		expect(e.deletedAt).toBeNull();
		expect(e.missingFields).toEqual([]);
		expect(e.complete).toBe(false);
		expect(e.result).toBeNull();
		expect(e.meta).toEqual({});
		// jsonb round-trips back to an object/array, not a string.
		expect(e.template).toEqual(template);
	});

	it("persists provided result/missingFields/complete/provider/meta", async () => {
		const e = await repo.save({
			sourceType: "audio",
			inputText: "transcription text",
			template: { fields: [] },
			result: { title: "x", value: null },
			missingFields: ["value"],
			complete: false,
			provider: "groq",
			model: "whisper-large-v3-turbo",
			meta: { latencyMs: 12 },
		});

		const found = await repo.findById(e.id);
		expect(found).not.toBeNull();
		expect(found?.result).toEqual({ title: "x", value: null });
		expect(found?.missingFields).toEqual(["value"]);
		expect(found?.provider).toBe("groq");
		expect(found?.meta).toEqual({ latencyMs: 12 });
	});

	it("findById returns null after soft delete", async () => {
		const e = await repo.save({
			sourceType: "text",
			inputText: "x",
			template: {},
		});
		expect(await repo.findById(e.id)).not.toBeNull();

		await repo.softDelete(e.id);
		expect(await repo.findById(e.id)).toBeNull();
	});

	it("updated_at trigger bumps updated_at on update", async () => {
		const e = await repo.save({
			sourceType: "text",
			inputText: "t",
			template: {},
		});
		await Bun.sleep(15);
		await repo.softDelete(e.id);

		const row = await db
			.selectFrom("extraction")
			.select(["created_at", "updated_at"])
			.where("id", "=", e.id)
			.executeTakeFirstOrThrow();

		expect(row.updated_at.getTime()).toBeGreaterThan(row.created_at.getTime());
	});

	it("audit trigger records INSERT and soft-delete as DELETE", async () => {
		const e = await repo.save({
			sourceType: "text",
			inputText: "audit me",
			template: {},
		});
		await repo.softDelete(e.id);

		const audit = await db
			.selectFrom("extraction_audit")
			.selectAll()
			.where("row_id", "=", e.id)
			.execute();

		// soft delete is recorded as DELETE, not UPDATE
		expect(audit.map((a) => a.operation).sort()).toEqual(["DELETE", "INSERT"]);

		const insert = audit.find((a) => a.operation === "INSERT");
		expect(insert?.row_id).toBe(e.id);
		expect(insert?.requested_by).toBeNull();
		expect((insert?.data as { input_text: string }).input_text).toBe(
			"audit me",
		);
		expect(
			(insert?.data as { deleted_at: string | null }).deleted_at,
		).toBeNull();

		const del = audit.find((a) => a.operation === "DELETE");
		expect(
			(del?.data as { deleted_at: string | null }).deleted_at,
		).not.toBeNull();
	});
});
