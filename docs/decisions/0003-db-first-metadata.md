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
- **Audit/history:** an `audit` schema + a generic `AFTER INSERT/UPDATE/DELETE` trigger
  writing `OLD/NEW` JSON snapshots. Reusable infra, attached per table (incl. `extraction`).

In Kysely, DB-managed columns are typed `Generated<>` and never written by the repository.

## Consequences
- Less app code, single source of truth, professional DB patterns (study value).
- Stronger Postgres lock-in; migrations now carry logic (triggers/functions).
- These behaviors are covered only by **integration tests** against real Postgres, never
  unit tests.
