# Second Brain Extraction API

Turn messy input into structured data. Send **text or audio** plus a **simple field
template**, and the API uses LLMs to extract the fields you asked for — clearly telling
you which required fields it couldn't find.

```
            text  ─┐
                   ├─►  [ Extraction API ]  ─►  { data, missingFields, complete }
  audio ─► (STT) ─┘          (LLM)
```

- **Simple templates.** Describe what you want as a flat list of fields
  (`[{ name, type, required }]`) — converted to JSON Schema internally.
- **Text or audio.** Audio is transcribed first (Groq Whisper), then extracted.
- **Honest results.** Missing required fields aren't an error — you get `200` with
  `complete: false` and a `missingFields` list.
- **Provider-agnostic.** Works across OpenAI / Gemini / Groq, forceable per request,
  with fallback. *(extraction pipeline lands in upcoming PRs)*
- **DB-first.** PostgreSQL owns ids, timestamps, soft delete, and audit history.

> v1 is under active development. Architecture, decisions (ADRs), roadmap and current
> status live in [`docs/`](./docs/) — start at [`docs/status.md`](./docs/status.md).

## Tech stack

Bun · ElysiaJS · TypeScript · PostgreSQL 18 · Kysely (+ kysely-ctl) · Biome

---

## Running locally

### Requirements

- **[Bun](https://bun.sh) ≥ 1.3** — `curl -fsSL https://bun.sh/install | bash`
- **Docker** with Compose v2+ (used for PostgreSQL and integration tests).
  On Windows/WSL, enable Docker Desktop → Settings → Resources → **WSL Integration**.

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment

Copy the example file and adjust if needed:

```bash
cp .env.example .env
```

| Variable          | Required | Default                    | Description                                   |
|-------------------|----------|----------------------------|-----------------------------------------------|
| `DATABASE_URL`    | **yes**  | —                          | Postgres connection string                    |
| `APP_ENV`         | no       | `local`                    | `local` or `prod`                             |
| `PORT`            | no       | `3000`                     | HTTP port                                     |
| `LOG_LEVEL`       | no       | `info`                     | `fatal`/`error`/`warn`/`info`/`debug`/`trace` |
| `OPENAI_API_KEY`  | no       | —                          | Enables the OpenAI provider when set          |
| `GROQ_API_KEY`    | no       | —                          | Enables the Groq provider when set            |
| `GEMINI_API_KEY`  | no       | —                          | Enables the Gemini provider when set          |
| `PROVIDER_ORDER`  | no       | `groq,openai,gemini`       | Fallback order when `?provider=` is not used  |
| `OPENAI_MODEL`    | no       | `gpt-4o-mini`              | Model for the OpenAI provider                 |
| `GROQ_MODEL`      | no       | `llama-3.3-70b-versatile`  | Model for the Groq provider                   |
| `GEMINI_MODEL`    | no       | `gemini-2.0-flash`         | Model for the Gemini provider                 |
| `GROQ_WHISPER_MODEL` | no    | `whisper-large-v3-turbo`   | STT model for audio (uses `GROQ_API_KEY`)     |

A provider is only used when its API key is set, so any subset works (or none, until the
extraction endpoint lands in PR6).

Config is validated at startup — the app **fails fast** with a clear message if a
required variable is missing or invalid.

### 3. Start PostgreSQL

The default `DATABASE_URL` points at the Postgres service in `docker-compose.yml`:

```bash
docker compose up -d postgres     # PostgreSQL 18 on localhost:5432
```

### 4. Run migrations

```bash
bun run migrate:latest            # reads DATABASE_URL from .env
```

### 5. Start the API

```bash
bun run dev                       # watch mode
# then, in another terminal:
curl localhost:3000/health        # {"status":"ok"}
curl localhost:3000/ready         # {"status":"ready"}  (checks Postgres)
```

### Alternative: everything in Docker

```bash
docker compose up --build         # app + postgres:18
```

---

## Extracting data

`POST /v1/extractions` (multipart) takes **text or audio** (exactly one) and a
JSON-encoded `template` (a flat field list). Missing required fields are **not** an error —
you get `200` with `complete:false` and a `missingFields` list. Add
`?provider=openai|groq|gemini` to force the extraction provider.

```bash
# Text
curl -s localhost:3000/v1/extractions \
  -F 'text=Buy 3 boxes of green tea by Friday' \
  -F 'template=[{"name":"item","type":"string","required":true},
                {"name":"quantity","type":"number","required":false}]'

# Audio (transcribed first via Groq Whisper, then extracted; max 24 MB)
curl -s localhost:3000/v1/extractions \
  -F 'audio=@note.mp3' \
  -F 'template=[{"name":"item","type":"string","required":true}]'
```

```json
{
  "data": { "item": "green tea", "quantity": 3 },
  "missingFields": [],
  "complete": true,
  "meta": { "id": "...", "provider": "groq", "model": "...", "fallbackUsed": false }
}
```

Read what's been extracted:

```bash
curl -s localhost:3000/v1/extractions/<id>        # one record (404 if missing)
curl -s 'localhost:3000/v1/extractions?limit=20'  # newest first
# → { "items": [...], "nextCursor": "<id>" }; pass it back as ?cursor= for the next page
```

Errors use [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) Problem Details
(`application/problem+json`): `404` unknown id, `422` invalid request/template (incl.
text-XOR-audio or bad pagination), `413` audio over 24 MB, `502` provider/transcription
failure, `503` no provider / transcription unavailable.

---

## Database & migrations (kysely-ctl)

Migrations live in `migrations/` and run **separately** from code deploys
(expand/contract); they read `DATABASE_URL` from the environment.

```bash
bun run migrate:latest            # apply all pending migrations
```

To add one, create `migrations/0003_my_change.ts` exporting only `up`, using `sql`
template fragments (see existing migrations for the pattern).

Migrations are **roll-forward only — there is no `down`**. To undo a change, write a new
migration that reverses it.

---

## Testing

```bash
bun test                  # everything (unit + integration; integration needs Docker)
bun run test:unit         # unit only — fast, no Docker
bun run test:integration  # integration — spins up an ephemeral Postgres automatically
```

Integration tests start a throwaway Postgres via `docker-compose.test.yml`, run the
migrations, and tear it down — so they exercise real triggers/defaults/audit, not mocks.

```bash
bun run db:test:up        # start the ephemeral test DB manually (port 5433)
bun run db:test:down      # stop and wipe it
```

Live LLM calls are **opt-in** (never in CI). Set a provider key and `LLM_LIVE=1` to run a
real smoke test against the configured provider(s):

```bash
LLM_LIVE=1 GROQ_API_KEY=... bun run test:integration
```

---

## Quality

```bash
bun run typecheck         # tsc --noEmit
bun run lint              # Biome check
bun run format            # Biome check --write
```

---

## Learn more

- [`docs/status.md`](./docs/status.md) — what's built and what's next
- [`docs/architecture.md`](./docs/architecture.md) — how the code is organized
- [`docs/roadmap.md`](./docs/roadmap.md) — delivery plan (PR0–PR11)
- [`docs/decisions/`](./docs/decisions/) — architecture decision records (ADRs)
