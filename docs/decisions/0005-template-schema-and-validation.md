# 0005 — Simple template → JSON Schema, Ajv "lenient", missingFields semantics

**Status:** Accepted

## Context
Clients send a simple template (`[{ name, type, required, description?, values?, items? }]`).
The signature feature is clearly reporting which required fields could not be extracted.
Incomplete extraction is a legitimate result, not an error.

## Decision
- **Canonical internal form = JSON Schema.** A custom, isolated converter
  (`domain/services/template-to-schema`) maps the simple template to JSON Schema. v1 types:
  `string`, `number`, `boolean`, `date`, `enum`, `array` of primitives — **no nesting**.
- **Input validation:** TypeBox (built into Elysia). **No Zod** (redundant; would also fight
  the JSON-Schema-as-canonical decision).
- **Output validation:** **Ajv** over the canonical schema, run in **"lenient"** mode — every
  field nullable, no Ajv-level `required` — so a `null`/missing value is never rejected.
- **`missingFields` rule** (`domain/services/missing-fields`, separate from Ajv): a field with
  `required:true` is missing if absent or `null`/`""`. `complete = missingFields.length === 0`.
- **Missing required fields → HTTP 200** with `complete:false` (not an error).

## Consequences
- "Incomplete" is a first-class, successful outcome with a consistent rule across providers.
- The strict schema (with real `required[]`) is sent to providers to guide them, never used
  to reject their output.
