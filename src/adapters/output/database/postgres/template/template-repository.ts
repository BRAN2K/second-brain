import type { Kysely } from "kysely";
import type { Template } from "@/domain/template/entities/template";
import type {
  ITemplateRepository,
  ListTemplatesParams,
  TemplatesPage,
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

  async list({ cursor, limit }: ListTemplatesParams): Promise<TemplatesPage> {
    let query = this.db
      .selectFrom("template")
      .selectAll()
      .where("deleted_at", "is", null)
      .orderBy("id", "desc")
      .limit(limit + 1);

    if (cursor) {
      query = query.where("id", "<", cursor);
    }

    const rows = await query.execute();
    const hasNext = rows.length > limit;

    return { templates: rows.slice(0, limit).map(toDomain), hasNext };
  }
}
