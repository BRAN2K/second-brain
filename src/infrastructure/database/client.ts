import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { Database } from "@/adapters/output/database/types";

/** Creates a Kysely client backed by node-postgres. Caller owns its lifecycle. */
export function createDb(connectionString: string): Kysely<Database> {
	return new Kysely<Database>({
		dialect: new PostgresDialect({
			pool: new Pool({ connectionString }),
		}),
	});
}
