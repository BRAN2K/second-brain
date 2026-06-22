# Architecture Decision Records

Each ADR captures one significant decision: its context, the choice, and consequences.
Format kept intentionally short. Status is `Accepted` unless noted.

| # | Decision |
|---|----------|
| [0001](./0001-runtime-and-architecture.md) | Bun + ElysiaJS, Clean Arch + Ports & Adapters |
| [0002](./0002-persistence-postgres-kysely.md) | Persistence: PostgreSQL 18 + Kysely |
| [0003](./0003-db-first-metadata.md) | DB-first metadata (uuidv7, timestamps, soft delete, audit) |
| [0004](./0004-provider-agnostic-llm.md) | Provider-agnostic LLM extraction with fallback |
| [0005](./0005-template-schema-and-validation.md) | Simple template → JSON Schema, Ajv "lenient", missingFields |
| [0006](./0006-audio-transcription.md) | Audio as a separate transcription stage (Groq Whisper) |
| [0007](./0007-error-model-rfc9457.md) | Error model: RFC 9457 Problem Details |
| [0008](./0008-testing-strategy.md) | Testing: behavior-first + ephemeral Postgres via Compose |
| [0009](./0009-observability.md) | Observability stack; tracing deferred to v1.1 |
| [0010](./0010-edge-protection-no-auth.md) | Edge protection via Caddy IP allowlist (no auth in v1) |
| [0011](./0011-config-and-secrets.md) | Config via env (fail-fast); secrets via Infisical near deploy |
