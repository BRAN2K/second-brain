# Development

## Prerequisites
- **Bun** ≥ 1.3 (`curl -fsSL https://bun.sh/install | bash`). Installed here at `~/.bun/bin`.
- **Docker** with Compose v2/v5. On Windows/WSL, enable Docker Desktop → Settings →
  Resources → **WSL Integration** for your distro, otherwise `docker` is unavailable in WSL.

## Setup
```bash
bun install
cp .env.example .env   # adjust as needed
```

## Scripts
```bash
bun run dev        # watch-mode server
bun start              # run server
bun test               # all tests (unit + integration; integration needs Docker)
bun run test:unit      # unit tests only (no Docker)
bun run test:integration  # integration tests (ephemeral Postgres via Compose)
bun run typecheck      # tsc --noEmit
bun run lint           # biome check
bun run format         # biome check --write
```

## Database

```bash
bun run db:test:up     # start ephemeral test Postgres (port 5433)
bun run db:test:down   # stop it (wipes data)
# CLI migrations (reads DATABASE_URL); used by the deploy pipeline:
DATABASE_URL=... bun run migrate:latest
DATABASE_URL=... bun run migrate:down
```

Migrations live in `migrations/` (kysely-ctl). Integration tests run them
programmatically against the ephemeral DB via `test/helpers/test-db.ts`.

## Run with Docker
```bash
docker compose up --build      # app + postgres:18
curl localhost:3000/health     # {"status":"ok"}
curl localhost:3000/ready      # {"status":"ready"} once Postgres is reachable
docker compose down            # stop (add -v to wipe the DB volume)
```

## Conventions
- **Path alias:** `@/*` → `src/*` (configured in `tsconfig.json`; Bun reads it at runtime,
  so it must be present in the runtime image).
- **Config:** environment variables only, validated at boot in `src/config` (fail-fast).
  Never read `process.env`/`Bun.env` outside that module.
- **Architecture:** keep `domain/` framework-free; see [architecture.md](./architecture.md).
- **Formatting/linting:** Biome (default style: tabs, double quotes, semicolons).

## Gotchas
- **Postgres 18 volume:** mount the named volume at `/var/lib/postgresql` (not `.../data`) —
  the 18+ image uses a version-specific subdirectory.
- **DB-generated ids:** the app does not generate ids; the column defaults to `uuidv7()`
  (Postgres 18) and the app reads them back via `RETURNING`.
- **Tests + DB (PR1+):** integration tests use an ephemeral Postgres via
  `docker-compose.test.yml` (not Testcontainers — broken under `bun test`).
