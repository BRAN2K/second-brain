# 0011 — Config via env (fail-fast); secrets via Infisical near deploy

**Status:** Accepted

## Context
Two environments (local and prod). API keys must not leak, and the team should not pass
`.env` files around as it grows.

## Decision
- **Config source:** environment variables only, validated and coerced at boot with TypeBox
  in `src/config` (**fail-fast** — the process exits on misconfiguration). The app never reads
  `Bun.env`/`process.env` outside that module.
- **Local dev:** a `.env` file (Bun reads it natively); `.env.example` is versioned.
- **Secrets manager:** **Infisical** (open-source, free tier, self-hostable later) injects
  secrets for local and prod — introduced **near the deploy stage**, not at the start.
- Because the app only reads env vars, the secret backend is swappable without code changes.

## Consequences
- No `.env` files circulating once Infisical is in; revocable per-person access.
- HashiCorp Vault rejected as overkill for v1; GitHub Secrets used only in the deploy
  pipeline, not as a runtime store.
