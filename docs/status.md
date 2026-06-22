# Project Status

_Last updated: 2026-06-21_

## Summary

The Second Brain Extraction API is in early v1 development. The bootstrap (PR0) is
complete and verified end-to-end, including via Docker Compose. Persistence and the
extraction pipeline are the next steps.

## Delivery progress

| PR | Scope | Status |
|----|-------|--------|
| PR0 | Bootstrap (Bun+Elysia, config, health, Docker, CI scaffold) | ✅ Done |
| PR1 | Persistence base (DB-first): Kysely, migrations, ephemeral test DB | ⏳ Next |
| PR2 | Template → JSON Schema | ⬜ Planned |
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

## Environment notes
- **Bun** installed at `~/.bun/bin/bun` (v1.3.14).
- **Docker** runs via Docker Desktop WSL integration (engine 29.5.3, Compose v5.x).
- Local secrets via `.env` (copy from `.env.example`); Infisical comes near deploy.

## Next step
PR1 — Persistence base (DB-first). The critical assumption (DB-generated `uuidv7()`
on Postgres 18) is already verified.
