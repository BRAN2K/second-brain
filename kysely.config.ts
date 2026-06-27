import { PostgresDialect } from "kysely";
import { defineConfig } from "kysely-ctl";
import { Pool } from "pg";

/**
 * kysely-ctl config (CLI migrations for dev/prod). Reads DATABASE_URL from the
 * environment. Migrations run separately from code deploys (expand/contract).
 */
export default defineConfig({
  dialect: new PostgresDialect({
    pool: new Pool({ connectionString: process.env.DATABASE_URL }),
  }),
  migrations: { migrationFolder: "migrations" },
});
