# Project Status

_Last updated: 2026-06-22_

## Summary

The Second Brain Extraction API is in early v1 development. Bootstrap (PR0) and the
DB-first persistence base (PR1) are complete and verified end-to-end, including via
Docker Compose. The template→schema and extraction pipeline are next.

## Delivery progress

| PR | Scope | Status |
|----|-------|--------|
| PR0 | Bootstrap (Bun+Elysia, config, health, Docker, CI scaffold) | ✅ Done |
| PR1 | Persistence base (DB-first): Kysely, migrations, ephemeral test DB | ✅ Done |
| PR2 | Template → JSON Schema | ⏳ Next |
| PR3 | Output validation + `missingFields` | ⬜ Planned |
| PR4 | Provider ports + selection/fallback (fakes) | ⬜ Planned |
| PR5 | Real providers (Groq/OpenAI/Gemini) | ⬜ Planned |
| PR6 | Use-case + extraction endpoint (text) | ⬜ Planned |
| PR7 | Audio transcription flow | ⬜ Planned |
| PR8 | Read endpoints (cursor pagination) | ⬜ Planned |
| PR9 | Observability stack | ⬜ Planned |
| PR10 | Deploy (GitHub Actions, ghcr.io, Caddy, migration pipeline) | ⬜ Planned |
| PR11 | Secrets (Infisical) | ⬜ Planned |

See [roadmap.md](./roadmap.md) for details.

## PR0 — verified

| Check | Result |
|---|---|
| `bun run typecheck` | ✅ clean |
| `bun test` | ✅ 8/8 (config + health) |
| `bun run lint` (Biome) | ✅ clean |
| Docker image build (tests run in build stage) | ✅ |
| `docker compose up` (app + `postgres:18`) | ✅ both healthy |
| `/health`, `/ready` via container | ✅ 200 |
| `postgres:18` provides native `uuidv7()` | ✅ confirmed |

### Bugs caught while validating PR0 (fixed)
- **Postgres 18 data dir:** image 18+ expects the volume mounted at `/var/lib/postgresql`
  (parent), not `/var/lib/postgresql/data`.
- **Runtime path alias:** Bun resolves the `@/*` alias from `tsconfig.json` at runtime,
  so the file must be copied into the release image.

## PR1 — verified

| Check | Result |
|---|---|
| `bun run typecheck` | ✅ clean |
| `bun run test:unit` | ✅ 10/10 (no Docker needed) |
| `bun run test:integration` | ✅ 5/5 (ephemeral Postgres via Compose) |
| `bun run lint` (Biome) | ✅ clean |
| `kysely migrate latest` (CLI) | ✅ applies migrations |
| Docker image build (typecheck + unit) | ✅ |
| `docker compose up`; `/ready` checks Postgres | ✅ 200 |

What landed: Kysely + kysely-ctl; **TS migrations** (`sql` fragments, `up` only —
roll-forward) — shared `set_updated_at` + generic
`record_audit` trigger fns, the `extraction` table (`id default uuidv7()`, timestamps,
soft delete) and a per-entity **`extraction_audit`** table (uniform schema, `row_id`
without FK, `requested_by` via session GUC, soft-delete recorded as `DELETE`, partitioned
monthly by `changed_at` + DEFAULT partition); `ExtractionRepository` port + Kysely adapter
(save/findById/softDelete); `docker-compose.test.yml` + ephemeral DB helper; integration
tests covering defaults/triggers/audit/soft-delete; `/ready` DB check wired via
`cmd/container`.

### Notes
- **Roll-forward only:** migrations have no `down` (see ADR 0003).
- The Docker build runs **unit tests only** (`test:unit`); integration tests need a
  Postgres service and run via `test:integration` (and in CI), not in the image build.

## Environment notes
- **Bun** installed at `~/.bun/bin/bun` (v1.3.14).
- **Docker** runs via Docker Desktop WSL integration (engine 29.5.3, Compose v5.x).
- Local secrets via `.env` (copy from `.env.example`); Infisical comes near deploy.

## Next step
PR2 — Template → JSON Schema (`domain/services/template-to-schema`).
