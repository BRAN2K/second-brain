import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { Database } from "@/adapters/output/database/postgres/types";

// TODO: refine this plugin

export function createDb(connectionString: string): Kysely<Database> {
  return new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool({ connectionString }),
    }),
  });
}
