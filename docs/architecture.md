# Architecture

The backend follows **Clean Architecture + Ports & Adapters (hexagonal)**, applied
pragmatically for a small domain (no DTO/mapper explosion — DTOs only at the HTTP edge).

**Core principle:** driven **ports (interfaces) live in `domain`**; adapters implement
them. The `domain` layer imports no frameworks (Elysia, Kysely, Ajv, provider SDKs).

## Layers

```
src/
  cmd/            composition root: DI wiring + server bootstrap
  config/         env -> TypeBox validation -> typed frozen config (fail-fast on boot)
  domain/         framework-free core
    entities/     domain types / value objects
    errors/       domain errors
    ports/        driven interfaces: ExtractionRepository, ExtractionProvider, Transcriber
    services/     pure rules: template-to-schema, missing-fields, provider-selection
    use-cases/    orchestration: extract-information
  adapters/
    input/        driving adapters: {feature}/http/{routes,validations,presenters}
    output/       driven adapters by capability:
                  llm/ transcription/ database/ validation/ observability/
  shared/         neutral utilities (no business rules)
```

### Why these choices
- **Ports grouped in `domain/ports`** — repository, provider, and transcriber are all
  driven ports; keeping them together is simpler than splitting per kind.
- **Output adapters named by capability** (`llm`, `transcription`, `database`…), not by
  transport — the folder says which port it implements, avoiding `http`-vs-`http` ambiguity.
- **Pure business rules in `domain/services`** — template→schema, the `missingFields`
  rule, and provider-selection policy must be framework-free and easily unit-tested.
- **`cmd/` is the composition root** — concrete adapters and the registry are wired here
  and injected into use-cases.

## Request flow (end to end)

```
Caddy (TLS + IP allowlist)
  -> Elysia input adapter: TypeBox validation (multipart, text XOR audio, size limits)
     -> if audio: Transcriber port -> Groq Whisper adapter  (>24MB => 413)
     -> use-case extract-information:
          template-to-schema  (simple template -> canonical JSON Schema)
          provider-selection  (forced ?provider=, or order; transient fallback; 1 retry)
          ExtractionProvider.extract
          validation service (Ajv "lenient") + missing-fields rule
          ExtractionRepository.save  (id from DB: default uuidv7())
     -> presenter -> 200 { data, missingFields, complete, meta }
```

Errors are mapped to **RFC 9457 Problem Details** (`application/problem+json`) by an
error presenter in the HTTP input adapter.

## Key boundaries
- **LLM output is never trusted as the source of truth.** The canonical schema is internal
  JSON Schema; we always re-validate provider output ourselves (Ajv) and derive
  `missingFields` from our own rule. See [ADR 0005](./decisions/0005-template-schema-and-validation.md).
- **Metadata is owned by the database** (ids, timestamps, soft delete, audit), keeping the
  app thin. See [ADR 0003](./decisions/0003-db-first-metadata.md).
