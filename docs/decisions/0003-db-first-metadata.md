# 0003 — DB-first metadata (uuidv7, timestamps, soft delete, audit)

**Status:** Accepted

## Context
Metadata that the database manages better than application code should live in the database,
keeping the app thin. Postgres lock-in is accepted and desired.

## Decision
Push metadata generation to Postgres 18:
- **ID:** `id uuid primary key default uuidv7()` — app does **not** generate ids; reads them
  back via `RETURNING`. UUIDv7 is time-ordered, preserving cursor pagination.
- **Timestamps:** `created_at`/`updated_at` via column default + a generic `set_updated_at()`
  `BEFORE UPDATE` trigger (Postgres does not auto-update `updated_at`).
- **Soft delete:** `deleted_at`; reads filter `deleted_at IS NULL`, encapsulated in the
  repository (or an `*_active` view).
- **Audit:** a **per-entity audit table with a uniform schema** (e.g. `extraction_audit`):
  `id`, `changed_at`, `operation`, `row_id`, `requested_by`, `data` (jsonb snapshot after
  the operation). One generic, reusable trigger function (`record_audit()`) writes to
  `<table>_audit`, derived from `TG_TABLE_NAME`. Details:
  - **Soft delete is recorded as `DELETE`** (an UPDATE that sets `deleted_at` from NULL to
    non-NULL), so the audit reads as a deletion.
  - **`row_id`** is the source row id with **no foreign key** — ids are immutable and the
    audit must outlive the row (incl. hard deletes), so it stays a valid historical id.
  - **`requested_by`** comes from the session GUC `app.requested_by`
    (`current_setting('app.requested_by', true)`), set by the app per request; NULL until
    auth exists.
  - **Partitioned monthly** by `RANGE (changed_at)` with a `DEFAULT` catch-all partition.
    Future monthly partitions are pre-created in production (e.g. pg_partman or a scheduled
    job); the partition key is part of the PK (`id, changed_at`).

In Kysely, DB-managed columns are typed non-insertable and never written by the repository.

## Migration conventions
- **Roll-forward only.** Migrations have **no `down`** — not even in dev. To undo, write a
  new migration. Avoids lossy/dangerous rollbacks and matches expand/contract (PR10).
- **Standard Kysely TS migrations.** Each migration is a `.ts` file exporting only `up`,
  using `sql` template fragments (one statement per `.execute()`).

## Consequences
- Less app code, single source of truth, professional DB patterns (study value).
- Stronger Postgres lock-in; migrations carry logic (triggers/functions).
- These behaviors are covered only by **integration tests** against real Postgres, never
  unit tests.
- Per-entity history means a little boilerplate per audited table (acceptable; a single
  generic `audit.log` remains a valid alternative for many low-value tables).
