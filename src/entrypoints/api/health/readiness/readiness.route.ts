import type { Kysely } from "kysely";
import type { Database } from "@/adapters/output/repositories/database";
import { Elysia } from "elysia";
import { sql } from "kysely";
import { readinessSchema } from "./readiness.schema";

export function readinessRoute(db: Kysely<Database>) {
  return new Elysia().get(
    "/health/readiness",
    async ({ status }) => {
      try {
        await sql`select 1`.execute(db);

        return { status: "ready" } satisfies { status: "ready" };
      } catch {
        return status(503, { status: "unready" });
      }
    },
    readinessSchema,
  );
}
