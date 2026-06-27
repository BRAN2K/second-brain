import { afterEach, describe, expect, it } from "bun:test";
import { createGroqWhisper } from "@/adapters/output/transcription/groq-whisper";
import { TranscriptionFailed } from "@/domain/extraction/errors/transcription-failed";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

interface Captured {
  url: string;
  init?: RequestInit;
}

function mockFetch(status: number, body: unknown, captured?: Captured): void {
  globalThis.fetch = ((url: string, init?: RequestInit) => {
    if (captured) {
      captured.url = String(url);
      captured.init = init;
    }
    return Promise.resolve(
      new Response(typeof body === "string" ? body : JSON.stringify(body), {
        status,
      }),
    );
  }) as unknown as typeof fetch;
}

const whisper = createGroqWhisper({ apiKey: "g-test", model: "whisper-x" });
const request = () => ({
  file: new Blob(["audio-bytes"], { type: "audio/mpeg" }),
  filename: "note.mp3",
});

describe("createGroqWhisper", () => {
  it("reports availability from the API key", () => {
    expect(whisper.isAvailable()).toBe(true);
    expect(
      createGroqWhisper({ apiKey: undefined, model: "m" }).isAvailable(),
    ).toBe(false);
  });

  it("posts multipart to the transcriptions endpoint and returns the text", async () => {
    const captured: Captured = { url: "" };
    mockFetch(200, { text: "buy three teas" }, captured);

    const result = await whisper.transcribe(request());

    expect(captured.url).toBe(
      "https://api.groq.com/openai/v1/audio/transcriptions",
    );
    expect(captured.init?.body).toBeInstanceOf(FormData);
    const sent = captured.init?.body as FormData;
    expect(sent.get("model")).toBe("whisper-x");

    expect(result.text).toBe("buy three teas");
    expect(result.model).toBe("whisper-x");
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("throws TranscriptionFailed on an HTTP error", async () => {
    mockFetch(500, "boom");
    await expect(whisper.transcribe(request())).rejects.toBeInstanceOf(
      TranscriptionFailed,
    );
  });

  it("throws TranscriptionFailed when the body has no text", async () => {
    mockFetch(200, { not_text: 1 });
    await expect(whisper.transcribe(request())).rejects.toBeInstanceOf(
      TranscriptionFailed,
    );
  });
});
