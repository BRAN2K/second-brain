# Project Status

_Last updated: 2026-06-22_

## Summary

The Second Brain Extraction API is in early v1 development. Bootstrap (PR0), the
DB-first persistence base (PR1), the template→schema converter (PR2), output validation +
the `missingFields` rule (PR3), the provider port + selection/fallback policy (PR4), and
the real providers — Groq/OpenAI/Gemini via raw `fetch` (PR5) — are complete and verified.
The use-case + extraction endpoint that wires it all together is next.

## Delivery progress

| PR | Scope | Status |
|----|-------|--------|
| PR0 | Bootstrap (Bun+Elysia, config, health, Docker, CI scaffold) | ✅ Done |
| PR1 | Persistence base (DB-first): Kysely, migrations, ephemeral test DB | ✅ Done |
| PR2 | Template → JSON Schema | ✅ Done |
| PR3 | Output validation + `missingFields` | ✅ Done |
| PR4 | Provider ports + selection/fallback (fakes) | ✅ Done |
| PR5 | Real providers (Groq/OpenAI/Gemini) | ✅ Done |
| PR6 | Use-case + extraction endpoint (text) | ⏳ Next |
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

## Environment notes
- **Bun** installed at `~/.bun/bin/bun` (v1.3.14).
- **Docker** runs via Docker Desktop WSL integration (engine 29.5.3, Compose v5.x).
- Local secrets via `.env` (copy from `.env.example`); Infisical comes near deploy.

## Next step
PR6 — `extract-information` use-case + extraction endpoint (text):
`adapters/input/extraction/http` (routes/validations/presenters), Problem Details,
persistence; wires the registry + selection + validation + missingFields together.
