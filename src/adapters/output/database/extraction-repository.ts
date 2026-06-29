import type { Insertable, Kysely } from "kysely";
import { Extraction } from "@/domain/extraction/entities/extraction";
import type { ExtractionSourceType } from "@/domain/extraction/enums/extraction-source-type";
import type {
  ExtractionRepository,
  ListExtractionsParams,
} from "@/domain/extraction/repositories/extraction";
import type { Database, ExtractionRow, ExtractionTable } from "./types";

/** Postgres-backed ExtractionRepository (Kysely). Soft delete is encapsulated here. */
export class KyselyExtractionRepository implements ExtractionRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async save(extraction: Extraction): Promise<Extraction> {
    const row = await this.db
      .insertInto("extraction")
      .values(toPersistence(extraction))
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

  async list({ cursor, limit }: ListExtractionsParams): Promise<Extraction[]> {
    let query = this.db
      .selectFrom("extraction")
      .selectAll()
      .where("deleted_at", "is", null)
      .orderBy("id", "desc")
      .limit(limit);

    if (cursor) {
      query = query.where("id", "<", cursor);
    }

    const rows = await query.execute();
    return rows.map(toDomain);
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

function toPersistence(e: Extraction): Insertable<ExtractionTable> {
  return {
    id: e.id,
    created_at: e.createdAt,
    // ponytail: enum value → column literal at the DB write boundary.
    source_type: e.sourceType as "text" | "audio",
    input_text: e.inputText,
    template: JSON.stringify(e.template),
    result: e.result == null ? null : JSON.stringify(e.result),
    missing_fields: JSON.stringify(e.missingFields),
    complete: e.complete,
    provider: e.provider,
    model: e.model,
    meta: JSON.stringify(e.meta),
  };
}

function toDomain(row: ExtractionRow): Extraction {
  return Extraction.reconstitute({
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    // ponytail: DB CHECK constraint guarantees the value is a valid source type.
    sourceType: row.source_type as ExtractionSourceType,
    inputText: row.input_text,
    template: row.template,
    result: row.result,
    missingFields: row.missing_fields,
    complete: row.complete,
    provider: row.provider,
    model: row.model,
    meta: row.meta,
  });
}
