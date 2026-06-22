# Roadmap

Delivery is sequenced as independent PRs. Each PR is shippable and (from PR1 on) uses
backward-compatible **expand/contract** migrations so the code and migration pipelines
stay independent.

## PR0 — Bootstrap ✅
Bun + Elysia + TS scaffold, hexagonal skeleton, `config/` (TypeBox fail-fast), `/health`,
Biome, `bun test`, multi-stage Dockerfile, `docker-compose.yml` base with `postgres:18`.

## PR1 — Persistence base (DB-first) ✅
Kysely + kysely-ctl. Migrations: generic infra (`set_updated_at()` trigger, `audit` schema
+ generic audit trigger) and the `extraction` table with `id default uuidv7()`,
`created_at`/`updated_at`/`deleted_at`, triggers attached. `ExtractionRepository` port +
adapter (soft-delete encapsulated). `docker-compose.test.yml` + ephemeral DB test helper.
Integration tests for defaults/triggers/audit. `/ready` checks the DB.

## PR2 — Template → JSON Schema ⏳
`domain/services/template-to-schema` (string/number/boolean/date/enum/array-of-primitives,
no nesting). Strict canonical schema + `required` metadata. TypeBox request validation.

## PR3 — Output validation + missingFields
`adapters/output/validation` (Ajv "lenient") + `domain/services/missing-fields`
(missing if absent / `null` / `""`). Behavior tests.

## PR4 — Provider ports + selection (fakes)
`domain/ports/extraction-provider`, `domain/services/provider-selection` (order, transient
fallback, 1 retry), registry in `adapters/output/llm`, fake providers. Tests only.

## PR5 — Real providers
Groq/OpenAI/Gemini implementations + `toProviderSchema` per dialect. `LLM_LIVE` opt-in tests.

## PR6 — Use-case + extraction endpoint (text)
`extract-information` use-case, `adapters/input/extraction/http` (routes/validations/
presenters), Problem Details, persistence. HTTP integration via `app.handle`.

## PR7 — Audio
`Transcriber` port + Groq Whisper adapter. Audio flow (24 MB cap → 413, text XOR audio).
Persist transcription (not the audio file).

## PR8 — Read endpoints
`GET /v1/extractions/:id` and `GET /v1/extractions` (cursor-based pagination by UUIDv7).

## PR9 — Observability
`pino` (JSON, requestId, secret redaction), `/metrics`, `docker-compose.observability.yml`
(Prometheus, Grafana, Loki, GlitchTip), configurable endpoints. (Tracing → v1.1.)

## PR10 — Deploy
GitHub Actions (build+test → ghcr.io → SSH deploy), Caddy (TLS + IP allowlist), and a
**separate** migration pipeline (`workflow_dispatch`, expand/contract).

## PR11 — Secrets
Infisical for local + prod; remove `.env` from the standard flow.

## Deferred to v1.1+
Distributed tracing (OTel + Tempo), dedicated monitoring VPS, auth (API Key/JWT), named
reusable templates, nested objects / arrays of objects, async/queued audio, stored audio.
