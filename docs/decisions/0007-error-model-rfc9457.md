# 0007 — Error model: RFC 9457 Problem Details

**Status:** Accepted

## Context
Errors need a consistent, standard wire format that's easy for clients to handle and aligned
with REST conventions.

## Decision
Use **RFC 9457 (Problem Details for HTTP APIs)**, `Content-Type: application/problem+json`,
with a field-level `errors[]` extension member:

```json
{ "type": "...", "title": "...", "status": 422, "detail": "...",
  "instance": "/v1/extractions", "errors": [{ "field": "...", "message": "..." }] }
```

Status mapping:
- `404` — extraction id not found (or soft-deleted)
- `422` — invalid template/input, text-XOR-audio violation, or bad `limit`/`cursor`
- `413` — audio over 24 MB
- `502` — provider/transcription failure (all exhausted / forced provider unavailable)
- `503` — no provider available, or transcription unavailable

Successful extraction (even incomplete) is **200**, never an error (see
[0005](./0005-template-schema-and-validation.md)).

## Consequences
- Uniform error envelope mapped by an error presenter in the HTTP input adapter.
- Clients distinguish "incomplete result" (200) from "request/processing failure" (4xx/5xx).
