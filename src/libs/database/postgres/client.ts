import type { Database } from "@/adapters/output/database/postgres/types";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";

let db: Kysely<Database> | undefined;

export function getDbConnection(connectionString: string): Kysely<Database> {
  if (!db) {
    db = new Kysely<Database>({
      dialect: new PostgresDialect({
        pool: new Pool({ connectionString }),
      }),
    });
  }

  return db;
}

export async function closeDbConnections(): Promise<void> {
  if (db) {
    await db.destroy();
    db = undefined;
  }
}

export type dbType = Kysely<Database>;
