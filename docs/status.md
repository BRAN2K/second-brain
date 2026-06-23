# Project Status

_Last updated: 2026-06-22_

## Summary

The Second Brain Extraction API has a working extraction pipeline end to end:
`POST /v1/extractions` takes **text or audio** + a template and returns structured data
with a `missingFields` report, persisted to Postgres (audio is transcribed first via Groq
Whisper), plus read endpoints (`GET /v1/extractions/:id` and a cursor-paginated list).
Bootstrap (PR0) through read endpoints (PR8) are complete and verified. Observability is next.

## Delivery progress

| PR | Scope | Status |
|----|-------|--------|
| PR0 | Bootstrap (Bun+Elysia, config, health, Docker, CI scaffold) | ✅ Done |
| PR1 | Persistence base (DB-first): Kysely, migrations, ephemeral test DB | ✅ Done |
| PR2 | Template → JSON Schema | ✅ Done |
| PR3 | Output validation + `missingFields` | ✅ Done |
| PR4 | Provider ports + selection/fallback (fakes) | ✅ Done |
| PR5 | Real providers (Groq/OpenAI/Gemini) | ✅ Done |
| PR6 | Use-case + extraction endpoint (text) | ✅ Done |
| PR7 | Audio transcription flow | ✅ Done |
| PR8 | Read endpoints (cursor pagination) | ✅ Done |
| PR9 | Observability stack | ⏳ Next |
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

## PR2 — verified

| Check | Result |
|---|---|
| `bun run typecheck` | ✅ clean |
| `bun run test:unit` | ✅ 32/32 (no Docker needed) |
| `bun run lint` (Biome) | ✅ clean |

What landed: the public `Template` type (flat `{name,type,required,description?,values?,items?}`);
`templateToSchema` (`domain/services`) — a pure converter producing a strict canonical JSON
Schema (`type:object`, `additionalProperties:false`, real `required[]`) plus a separate
`required` list for the missingFields rule (PR3). Supports string/number/boolean, `date`→
`string`+`format:date`, `enum`→`string`+`enum`, and `array` of any leaf (incl. enum); no
nesting. `TemplateInvalid` (`domain/errors`) collects **every** semantic issue (empty template,
duplicate/blank names, enum without values, array without items). TypeBox `TemplateInputSchema`
(`adapters/input/extraction/http/validations`) validates request shape at the edge
(`additionalProperties:false`), while the domain service stays the source of truth for semantics.

## PR3 — verified

| Check | Result |
|---|---|
| `bun run typecheck` | ✅ clean |
| `bun run test:unit` | ✅ 49/49 (no Docker needed) |
| `bun run lint` (Biome) | ✅ clean |

What landed: `createOutputValidator` (`adapters/output/validation`) — Ajv in **"lenient"**
mode: derives a lenient schema from the strict canonical one (every field nullable, no
`required`, `removeAdditional:"all"`), so an **incomplete** extraction is never rejected,
while wrong types and out-of-enum values still surface as structural errors; unknown
(hallucinated) keys are stripped and the input is never mutated. `findMissingFields`
(`domain/services/missing-fields`) — the completeness source of truth: a required field is
missing when **absent**, **null**, or an **empty/whitespace string**; `0`/`false`/`[]` are
legitimate values. (`ajv` added as the only new dependency.)

## PR4 — verified

| Check | Result |
|---|---|
| `bun run typecheck` | ✅ clean |
| `bun run test:unit` | ✅ 63/63 (no Docker needed) |
| `bun run lint` (Biome) | ✅ clean |

What landed: the `ExtractionProvider` port (`domain/ports`, `name`/`isAvailable`/`extract`,
output never trusted) plus `ProviderError` (carries `transient`) and `NoProviderAvailable`.
`selectAndExtract` (`domain/services/provider-selection`) implements the ADR 0004 policy:
forced (`?provider=`) runs one provider with **no fallback**; otherwise providers are tried
in `order`, skipping unavailable ones; **only transient** failures trigger one retry and
fallback to the next; permanent failures stop immediately. `createProviderRegistry`
(`adapters/output/llm`) is the composition seam (all/available/get/order). Fully covered by
unit tests with fake providers (call-count assertions for retry/fallback); **no real SDK
calls** — those land in PR5.

## PR5 — verified

| Check | Result |
|---|---|
| `bun run typecheck` | ✅ clean |
| `bun run test:unit` | ✅ 82/82 (no Docker needed) |
| `bun run lint` (Biome) | ✅ clean |
| `LLM_LIVE=1 ... bun run test:integration` | opt-in (skipped by default) |

What landed: real providers via **raw `fetch`** (no SDKs — the dependency decision per the
low-coupling directive). One `createOpenAiCompatibleProvider` covers **OpenAI and Groq**
(same Chat Completions wire format, different base URL/model, `json_object` mode + schema in
the prompt); `createGeminiProvider` uses Gemini's REST `generateContent` with a native
`responseSchema`. `to-provider-schema` does the per-dialect translation (prompt text vs
`toGeminiSchema`); `errors.ts` maps HTTP status → transient (408/429/5xx) vs permanent so
the PR4 policy can retry/fall back; network failures are transient. `isAvailable()` is driven
by each API key; config gains `*_API_KEY`, `PROVIDER_ORDER`, and `*_MODEL` (with defaults);
`createLlmRegistry(config)` wires it all. Unit-tested with a mocked `fetch` (request shape +
parsing + every error path); a `LLM_LIVE=1` opt-in test hits the real APIs for configured keys.

## PR6 — verified

| Check | Result |
|---|---|
| `bun run typecheck` | ✅ clean |
| `bun run test:unit` | ✅ 98/98 (no Docker needed) |
| `bun run test:integration` | ✅ (real DB; includes end-to-end endpoint test) |
| `bun run lint` (Biome) | ✅ clean |

What landed: `extractInformation` (`domain/use-cases`) orchestrates template→schema →
provider selection/fallback → lenient validation → `missingFields` → persist; the validator
is injected as a plain function so the domain never imports the Ajv adapter. `POST
/v1/extractions` (`adapters/input/extraction/http`) takes `multipart/form-data` (`text`,
JSON `template`, optional `instructions`; `?provider=` forces one). Incomplete results are
**200** with `complete:false`; failures are **RFC 9457 Problem Details**
(`application/problem+json`): 422 (request/template invalid), 502 (provider failed / forced
unavailable / invalid output), 503 (no provider). `InvalidProviderOutput` covers a provider
returning structurally wrong data. The container now wires the provider registry + validator,
and `/ready` requires Postgres **and** ≥1 available provider. Covered by HTTP tests via
`app.handle` (fakes) and an end-to-end test against real Postgres (jsonb round-trip + DB id).

> Note: Elysia auto-parses multipart fields that are valid JSON, so `template` arrives
> already parsed; the request parser accepts both that and a raw string.

## PR7 — verified

| Check | Result |
|---|---|
| `bun run typecheck` | ✅ clean |
| `bun run test:unit` | ✅ 108/108 (no Docker needed) |
| `bun run test:integration` | ✅ (real DB) |
| `bun run lint` (Biome) | ✅ clean |

What landed: the `Transcriber` port (`domain/ports`) + `createGroqWhisper`
(`adapters/output/transcription`) via raw `fetch` against Groq's `audio/transcriptions`
(`whisper-large-v3-turbo`). The use-case now takes a `source` that is **text XOR audio**;
for audio it transcribes first (one pre-step) then runs the identical pipeline, persisting
`sourceType:"audio"` with the **transcript** as `inputText` (the audio file is never stored).
Template validation runs **before** transcription (fail fast, no STT cost). The endpoint
enforces text-XOR-audio (422), the **24 MB** cap (413), and maps `TranscriptionUnavailable`
→ 503 / `TranscriptionFailed` → 502. `?provider=` still controls extraction only. New errors:
`TranscriptionUnavailable`, `TranscriptionFailed`. Config adds `GROQ_WHISPER_MODEL`.

## PR8 — verified

| Check | Result |
|---|---|
| `bun run typecheck` | ✅ clean |
| `bun run test:unit` | ✅ 115/115 (no Docker needed) |
| `bun run test:integration` | ✅ (real DB; list pagination + soft-delete) |
| `bun run lint` (Biome) | ✅ clean |

What landed: `ExtractionRepository.list({ cursor, limit })` (Kysely: `deleted_at is null`,
`id < cursor`, `order by id desc`, `limit`) — UUIDv7 is time-ordered so this is newest-first.
`GET /v1/extractions/:id` returns the public record or **404** Problem Details when missing
or soft-deleted; `GET /v1/extractions` returns `{ items, nextCursor }` (nextCursor = last id
when the page is full, else null). `parsePagination` validates `limit` (1..100, default 20)
and an optional UUID `cursor`, returning **422** on bad values. Read presenters
(`presentExtraction`/`presentList`/`presentNotFound`) omit soft-delete bookkeeping. Covered by
HTTP unit tests (fakes) and an integration test against real Postgres.

## Environment notes
- **Bun** installed at `~/.bun/bin/bun` (v1.3.14).
- **Docker** runs via Docker Desktop WSL integration (engine 29.5.3, Compose v5.x).
- Local secrets via `.env` (copy from `.env.example`); Infisical comes near deploy.

## Next step
PR9 — Observability: `pino` (JSON, requestId, secret redaction), `/metrics`,
`docker-compose.observability.yml` (Prometheus, Grafana, Loki, GlitchTip).
