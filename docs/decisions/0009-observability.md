# 0009 — Observability stack; tracing deferred to v1.1

**Status:** Accepted

## Context
Single VPS with fixed cost (resource usage is "free"), and the project is partly for study —
so a professional observability setup has real value, staged near deployment.

## Decision
- **Logs:** `pino` (JSON, `requestId`, secret redaction) → **Loki**.
- **Metrics:** `/metrics` (Prometheus) → **Grafana** (latency per stage/provider, fallback
  count, tokens/cost, complete/incomplete/error).
- **Errors:** **GlitchTip** (open-source, Sentry-compatible).
- **Health:** `/health` (liveness) + `/ready` (Postgres reachable AND ≥1 provider available).
- Stack lives in a separate `docker-compose.observability.yml`; the app talks to it via
  **configurable endpoints**, so moving it to a dedicated monitoring host later is a config
  change, not a rewrite.
- **Tracing (OpenTelemetry + Tempo) is deferred to v1.1.**

## Consequences
- Production-grade visibility on one box; clean path to a separate monitoring VPS later.
- More moving parts than a minimal setup — justified by the study goal and fixed VPS cost.
