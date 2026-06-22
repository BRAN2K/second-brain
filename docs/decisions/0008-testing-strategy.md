# 0008 — Testing: behavior-first + ephemeral Postgres via Compose

**Status:** Accepted

## Context
Much of the system depends on non-deterministic LLMs. Tests must be reliable, cheap, and
runnable anywhere, while still exercising real database behavior (triggers, defaults, audit).

## Decision
- **`bun test`** (native, no extra runner).
- **Unit tests cover behavior, not implementation** — converter, `missingFields`,
  provider-selection/fallback (with **fakes**), `toProviderSchema` snapshots.
- **HTTP integration** via `app.handle(new Request(...))` with fake adapters.
- **Database integration** uses an **ephemeral Postgres** started from
  `docker-compose.test.yml` (up → healthcheck → migrate via kysely-ctl → test → teardown).
  Testcontainers was **rejected** — it doesn't work reliably under `bun test`
  (dockerode/RYUK issues).
- Real LLM/STT calls are **opt-in** via `LLM_LIVE=1`, kept out of CI.

## Consequences
- Deterministic, fast core suite; real DB behavior is genuinely tested (no DB mocks).
- One extra Compose file for the test database; parity with production.
