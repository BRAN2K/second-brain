import { promises as fs } from "node:fs";
import path from "node:path";
import type { Kysely } from "kysely";
import { FileMigrationProvider, Migrator } from "kysely/migration";
import type { Database } from "@/adapters/output/database/types";
import { createDb } from "@/infrastructure/database/client";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgres://test:test@localhost:5433/secondbrain_test";

let composeStarted = false;

/**
 * Ensures the ephemeral test Postgres (docker-compose.test.yml) is running and
 * migrated, then returns a fresh Kysely client. Replaces Testcontainers, which
 * does not work reliably under `bun test`. Callers must `db.destroy()` in afterAll.
 */
export async function setupTestDb(): Promise<Kysely<Database>> {
  if (!composeStarted) {
    const proc = Bun.spawnSync([
      "docker",
      "compose",
      "-f",
      "docker-compose.test.yml",
      "up",
      "-d",
      "--wait",
    ]);
    if (proc.exitCode !== 0) {
      throw new Error(
        `failed to start test database:\n${proc.stderr.toString()}`,
      );
    }
    composeStarted = true;
  }

  const db = createDb(TEST_DATABASE_URL);
  await migrateToLatest(db);
  return db;
}

async function migrateToLatest(db: Kysely<Database>): Promise<void> {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.resolve("migrations"),
    }),
  });

  const { error, results } = await migrator.migrateToLatest();
  if (error) {
    throw error instanceof Error ? error : new Error(String(error));
  }
  const failed = results?.find((r) => r.status === "Error");
  if (failed) {
    throw new Error(`migration failed: ${failed.migrationName}`);
  }
}
