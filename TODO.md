# TODO

Extracted from inline `// TODO` comments in the codebase, grouped by area. Each item
keeps its file reference so it's easy to jump back into context.

## Error handling

- **`create-template/controller.ts`** — nothing checks that a route's `response` map
  covers every status the use case can actually throw. An uncovered status (e.g. a
  future `ConflictError`) still returns correctly at runtime — Elysia only validates
  statuses it has a schema for — but the OpenAPI contract silently omits it.
  TypeScript can't catch this because throws aren't part of a function's return type;
  closing this gap for real requires encoding thrown errors in the use case's return
  type (e.g. `Result<T, E>`).
  → `src/adapters/input/template/http/create-template/controller.ts`

- **`error/handler.ts`** — same gap, other side: if a route's `response` map has no
  schema for `error.status`, Elysia skips response validation entirely for that
  status and the request still returns correctly — but the route's declared OpenAPI
  contract silently omits it. Not fixable in the handler itself: it has no way to
  know which statuses a given route promises to cover.
  → `src/infrastructure/helpers/errors/handler.ts`

## Extraction route (still a stub)

All in `src/adapters/input/extraction/http/create-extraction.ts`:

- Route must accept a middleware function that can validate the request payload and
  handle errors automatically (i.e. adopt the pattern already used by
  `create-template`).
- Route should be a `POST` with `multipart/form-data` content type (for audio
  uploads).
- Define the route request payload using a schema validation library.
- Define the route response payload using a schema validation library.
- Define a mapper to the response payload.

## Infrastructure cleanup

- **`config/index.ts`** — refactor/simplify this file.
  → `src/infrastructure/helpers/config/index.ts`
- **`database/postgres/client.ts`** — refine this plugin.
  → `src/infrastructure/helpers/database/postgres/client.ts`
- **`metrics/metrics.ts`** — register actual application metrics (currently just
  returns an empty `Registry`).
  → `src/infrastructure/helpers/metrics/metrics.ts`
