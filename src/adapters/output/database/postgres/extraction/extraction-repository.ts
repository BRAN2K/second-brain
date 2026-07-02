import type { Kysely } from "kysely";
import type { Extraction } from "@/domain/extraction/entities/extraction";
import type {
  IExtractionRepository,
  ListExtractionsParams,
} from "@/domain/extraction/repositories/extraction";
import type { Database } from "../types";
import { toDomain, toPersistence } from "./mappers/extraction-mapper";

export class PostgresExtractionRepository implements IExtractionRepository {
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
}
