# Second Brain Extraction API

Backend that receives content (text **xor** audio) plus a simple field template, uses
LLMs to return structured data, and reports which required fields are missing.

> v1 in progress. See the full plan in `~/.claude/plans/` (PR0–PR11 roadmap).

## Stack

- **Runtime/HTTP:** Bun + ElysiaJS
- **Persistence:** PostgreSQL 18 + Kysely (DB-first metadata: ids, timestamps, soft delete, audit)
- **Architecture:** Clean Architecture + Ports & Adapters (hexagonal), applied pragmatically

## Architecture (target layout)

```
src/
  cmd/            composition root (DI wiring, server bootstrap)
  config/         env -> TypeBox validation -> typed frozen config (fail-fast)
  domain/         framework-free core
    entities/     domain types / value objects
    errors/       domain errors
    ports/        driven interfaces (repository, provider, transcriber)
    services/     pure business rules (template->schema, missing-fields, provider-selection)
    use-cases/    orchestration (extract-information)
  adapters/
    input/        driving adapters: {feature}/http/{routes,validations,presenters}
    output/       driven adapters by capability: llm, transcription, database, validation, observability
  shared/         neutral utilities
```

## Scripts

```bash
bun install        # install dependencies
bun run dev        # watch-mode server
bun start          # run server
bun test           # run tests
bun run typecheck  # tsc --noEmit
bun run lint       # biome check
bun run format     # biome check --write
```

## Configuration

Config comes only from environment variables, validated at boot (fail-fast). Copy
`.env.example` to `.env` for local development. Secrets move to Infisical near deploy.

## Local with Docker

```bash
docker compose up --build   # app + postgres:18
```
