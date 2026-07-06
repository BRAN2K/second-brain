import type { Kysely } from "kysely";
import type { Template } from "@/domain/template/entities/template";
import type {
  ITemplateRepository,
  ListTemplatesParams,
} from "@/domain/template/repositories/template";
import type { Database } from "../types";
import { toDomain, toPersistence } from "./mappers/template-mapper";

export class PostgresTemplateRepository implements ITemplateRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async save(template: Template): Promise<Template> {
    const row = await this.db
      .insertInto("template")
      .values(toPersistence(template))
      .returningAll()
      .executeTakeFirstOrThrow();

    return toDomain(row);
  }

  async findById(id: string): Promise<Template | null> {
    const row = await this.db
      .selectFrom("template")
      .selectAll()
      .where("id", "=", id)
      .where("deleted_at", "is", null)
      .executeTakeFirst();

    return row ? toDomain(row) : null;
  }

  async list({ cursor, limit }: ListTemplatesParams): Promise<Template[]> {
    let query = this.db
      .selectFrom("template")
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
