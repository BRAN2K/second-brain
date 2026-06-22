# 0001 — Runtime: Bun + ElysiaJS; Architecture: Clean Arch + Ports & Adapters

**Status:** Accepted

## Context
Greenfield v1 of an LLM extraction API, also a study project aiming for a professional,
production-like setup. Core directive: low coupling; avoid external deps without real value.

## Decision
- **Runtime/HTTP:** Bun + ElysiaJS (decided up front). Use Elysia's built-in TypeBox for
  request validation instead of adding a second validation lib.
- **Architecture:** Clean Architecture + Ports & Adapters (hexagonal), applied
  **pragmatically**. Driven ports live in `domain/ports`; `domain` imports no frameworks.
  Output adapters are named by capability; input adapters are per-feature with
  `routes/validations/presenters`. `cmd/` is the composition root (DI).

## Consequences
- Clear separation and testability; domain logic is framework-free and easy to unit test.
- Some ceremony for a single entity — mitigated by keeping DTOs only at the HTTP edge and
  avoiding layer-to-layer mappers.
- Lock-in to Bun/Elysia idioms is accepted.
