# Roadmap

Delivery is sequenced as independent PRs. Each PR is shippable and (from PR1 on) uses
backward-compatible **expand/contract** migrations so the code and migration pipelines
stay independent.

## PR0 — Bootstrap ✅
Bun + Elysia + TS scaffold, hexagonal skeleton, `config/` (TypeBox fail-fast), `/health`,
Biome, `bun test`, multi-stage Dockerfile, `docker-compose.yml` base with `postgres:18`.

## PR1 — Persistence base (DB-first) ✅
Kysely + kysely-ctl (TS migrations, roll-forward only). Shared trigger fns
(`set_updated_at`, generic `record_audit`) and the `extraction` table with
`id default uuidv7()`, `created_at`/`updated_at`/`deleted_at`, plus a per-entity
`extraction_audit` table (uniform schema, `row_id` without FK, `requested_by` via session
GUC, soft-delete recorded as `DELETE`, partitioned monthly by `changed_at`).
`ExtractionRepository` port + adapter (soft-delete encapsulated). `docker-compose.test.yml`
+ ephemeral DB helper. Integration tests for defaults/triggers/audit. `/ready` checks the DB.

## PR2 — Template → JSON Schema ✅
`domain/services/template-to-schema` (string/number/boolean/date/enum/array-of-primitives,
no nesting). Strict canonical schema + `required` metadata; `TemplateInvalid` collects every
semantic issue (domain is the source of truth). TypeBox request validation at the HTTP edge.

## PR3 — Output validation + missingFields ✅
`adapters/output/validation` (Ajv "lenient": every field nullable, no `required`,
unknown keys stripped — incomplete output is never rejected, wrong types are) +
`domain/services/missing-fields` (missing if absent / `null` / `""`). Behavior tests.

## PR4 — Provider ports + selection (fakes) ✅
`domain/ports/extraction-provider`, `domain/services/provider-selection` (forced = no
fallback; order skips unavailable; transient-only fallback + 1 retry; permanent stops),
`ProviderError`/`NoProviderAvailable`, registry in `adapters/output/llm`, fake providers.
Tests only (no real SDK calls).

## PR5 — Real providers ✅
Groq/OpenAI/Gemini implementations via raw `fetch` (no SDKs): one OpenAI-compatible
adapter (OpenAI + Groq) + a Gemini adapter, `toProviderSchema` per dialect, HTTP→transient
classification, key-based `isAvailable()`, config keys/order/models, `createLlmRegistry`.
Unit-tested with a mocked `fetch`; `LLM_LIVE=1` opt-in live smoke test.

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
