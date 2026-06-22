# 0010 — Edge protection via Caddy IP allowlist (no auth in v1)

**Status:** Accepted

## Context
Auth is out of scope for v1, but the endpoint calls paid LLM/STT services, so an open
endpoint is a real cost risk. Rate limiting and access control should not couple into the
application code.

## Decision
- Access control and rate limiting live at the **edge (Caddy)**, not in the app:
  - **IP allowlist** restricting access to the owner — effectively a personal access gate.
  - Optional `rate_limit`.
- The **app keeps only intrinsic guards**: size limits (audio/text/template) and timeouts.
  No in-app rate limiting or daily cap in v1.

## Consequences
- The application stays focused on extraction (low coupling); cost risk is neutralized.
- Residential IPs change — when that becomes painful (or more users arrive), this is the
  hook to introduce **API Key / JWT** and relax the allowlist, without restructuring.
