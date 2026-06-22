# 0006 — Audio as a separate transcription stage (Groq Whisper)

**Status:** Accepted

## Context
The API accepts text or audio. Not every LLM provider transcribes audio well, and "provider
agnostic" gets messy if transcription is coupled to a multimodal provider. Budget is tight.

## Decision
- Transcription is a **separate stage** behind a `Transcriber` port. Audio → transcript →
  the same extraction pipeline as text. `?provider=` controls **extraction only**.
- **STT provider: Groq Whisper (`whisper-large-v3-turbo`)** — cheap (~US$0.04/h) and fast.
- **Synchronous** processing with a **24 MB** audio cap (→ `413`); no queue in v1.
- Input is `multipart/form-data` (always); **text XOR audio** (422 if both/neither).
- The original audio is **not stored** — only the transcription text.

## Consequences
- The extraction pipeline is identical for text and audio (audio adds one pre-step).
- Not tied to multimodal providers; swapping STT later is a new adapter, not a rewrite.
- Large/long audio needs a future async/queue design (the use-case is already isolated).
