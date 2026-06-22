# 0002 — Persistence: PostgreSQL 18 + Kysely (+ kysely-ctl)

**Status:** Accepted

## Context
v1 persists extractions from the start. Needed a data-access approach with strong type
safety, low coupling, and mature migrations, without a heavy ORM.

## Decision
- **PostgreSQL** for the whole project; pinned to **18** (native `uuidv7()` — verified).
- **Kysely** as a typed query builder (type-first, thin, Bun-friendly, good JSONB support),
  over Knex (weak types, legacy) and Drizzle/Prisma (more opinionated / Bun friction).
- **kysely-ctl** for migrations (TS migrations, expand/contract discipline).
- Single `extraction` table; the template is stored inline as a **JSONB snapshot** (no
  named/reusable templates in v1).

## Consequences
- Strong end-to-end types; SQL stays transparent; low cost to change later.
- Migrations are a separate concern (not bundled in the query lib) — acceptable.
- Postgres-specific features are embraced (see [0003](./0003-db-first-metadata.md)).
