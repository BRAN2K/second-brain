# 0004 — Provider-agnostic LLM extraction with fallback

**Status:** Accepted

## Context
The API must work across multiple LLM providers (OpenAI, Gemini, Groq), allow forcing one
per request, and fall back when the preferred provider is unavailable.

## Decision
- An `ExtractionProvider` **port** in `domain/ports` with `name`, `isAvailable()`, and
  `extract({ content, schema, instructions })`. Concrete adapters live in
  `adapters/output/llm`, each translating the canonical JSON Schema to its dialect
  (`toProviderSchema`).
- **Selection policy** (`domain/services/provider-selection`):
  - `?provider=X` forces X — **no fallback**; returns 502 if unavailable.
  - Without it: try providers in `PROVIDER_ORDER`.
  - **Fallback only on transient failures** (timeout, 5xx, 429, missing key); 1 retry.
  - **No circuit breaker** in v1.
- Provider output is **never** the source of truth — always re-validated on our side.

## Implementation (PR5)
- **Raw `fetch`, no SDKs.** Each adapter is a thin HTTP call, keeping the dependency
  surface at zero and giving us full control over transient/permanent classification
  (we already own retry/fallback). One `createOpenAiCompatibleProvider` serves **OpenAI
  and Groq** (same Chat Completions format, different base URL/model); a separate adapter
  serves **Gemini** (`generateContent` + native `responseSchema`).
- **HTTP → classification:** 408/429/5xx and network failures are transient; other 4xx
  are permanent (`adapters/output/llm/errors`).
- **Availability:** `isAvailable()` returns true iff the provider's API key is configured.

## Consequences
- Uniform behavior across providers, including those without strict schema enforcement.
- Per-provider schema translation is a small adapter concern.
- Forced-provider requests respect intent rather than silently switching.
