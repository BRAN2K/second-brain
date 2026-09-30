import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";

export function createPostgresClient<T>(connectionString: string): Kysely<T> {
  return new Kysely<T>({
    dialect: new PostgresDialect({
      pool: new Pool({ connectionString }),
    }),
  });
}
