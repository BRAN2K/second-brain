import type { Kysely } from "kysely";
import type { Extraction, NewExtraction } from "@/domain/entities/extraction";
import type { ExtractionRepository } from "@/domain/ports/extraction-repository";
import type { Database, ExtractionRow } from "./types";

/** Postgres-backed ExtractionRepository (Kysely). Soft delete is encapsulated here. */
export class KyselyExtractionRepository implements ExtractionRepository {
	constructor(private readonly db: Kysely<Database>) {}

	async save(input: NewExtraction): Promise<Extraction> {
		const row = await this.db
			.insertInto("extraction")
			.values({
				source_type: input.sourceType,
				input_text: input.inputText,
				template: JSON.stringify(input.template),
				result: input.result == null ? null : JSON.stringify(input.result),
				missing_fields: JSON.stringify(input.missingFields ?? []),
				complete: input.complete ?? false,
				provider: input.provider ?? null,
				model: input.model ?? null,
				meta: JSON.stringify(input.meta ?? {}),
			})
			.returningAll()
			.executeTakeFirstOrThrow();

		return toDomain(row);
	}

	async findById(id: string): Promise<Extraction | null> {
		const row = await this.db
			.selectFrom("extraction")
			.selectAll()
			.where("id", "=", id)
			.where("deleted_at", "is", null)
			.executeTakeFirst();

		return row ? toDomain(row) : null;
	}

	async softDelete(id: string): Promise<void> {
		await this.db
			.updateTable("extraction")
			.set({ deleted_at: new Date() })
			.where("id", "=", id)
			.where("deleted_at", "is", null)
			.execute();
	}
}

function toDomain(row: ExtractionRow): Extraction {
	return {
		id: row.id,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
		deletedAt: row.deleted_at,
		sourceType: row.source_type,
		inputText: row.input_text,
		template: row.template,
		result: row.result,
		missingFields: row.missing_fields,
		complete: row.complete,
		provider: row.provider,
		model: row.model,
		meta: row.meta,
	};
}
