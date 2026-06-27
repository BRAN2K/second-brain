import { describe, expect, it } from "bun:test";
import { fakeProvider } from "@test/helpers/fake-provider";
import { fakeRepository } from "@test/helpers/fake-repository";
import { fakeTranscriber } from "@test/helpers/fake-transcriber";
import { createOutputValidator } from "@/adapters/output/validation/output-validator";
import type { Template } from "@/domain/extraction/entities/template";
import { InvalidProviderOutput } from "@/domain/extraction/errors/invalid-provider-output";
import { NoProviderAvailable } from "@/domain/extraction/errors/no-provider-available";
import { TemplateInvalid } from "@/domain/extraction/errors/template-invalid";
import { TranscriptionUnavailable } from "@/domain/extraction/errors/transcription-unavailable";
import {
  type ExtractInformationDeps,
  extractInformation,
} from "@/domain/extraction/use-cases/extract-information";

const validate = createOutputValidator().validate;
const order = ["openai", "groq"];

const template: Template = [
  { name: "title", type: "string", required: true },
  { name: "amount", type: "number", required: false },
];

const textSource = (text: string) => ({ kind: "text" as const, text });
const audioSource = () => ({
  kind: "audio" as const,
  file: new Blob(["fake-bytes"], { type: "audio/mpeg" }),
  filename: "note.mp3",
});

function deps(
  overrides: Partial<ExtractInformationDeps> = {},
): ExtractInformationDeps {
  return {
    providers: [fakeProvider({ name: "openai", data: { title: "Hi" } })],
    order,
    validate,
    repository: fakeRepository(),
    transcriber: fakeTranscriber(),
    ...overrides,
  };
}

describe("extractInformation (text)", () => {
  it("returns a complete result and persists it", async () => {
    const repository = fakeRepository();
    const result = await extractInformation(
      deps({
        providers: [
          fakeProvider({ name: "openai", data: { title: "Hi", amount: 5 } }),
        ],
        repository,
      }),
      { source: textSource("buy"), template },
    );

    expect(result.complete).toBe(true);
    expect(result.data).toEqual({ title: "Hi", amount: 5 });
    expect(result.meta.provider).toBe("openai");
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0].sourceType).toBe("text");
    expect(repository.saved[0].inputText).toBe("buy");
  });

  it("reports missing required fields but still succeeds", async () => {
    const result = await extractInformation(
      deps({
        providers: [fakeProvider({ name: "openai", data: { amount: 5 } })],
      }),
      { source: textSource("buy"), template },
    );
    expect(result.complete).toBe(false);
    expect(result.missingFields).toEqual(["title"]);
  });

  it("honors a forced provider", async () => {
    const result = await extractInformation(
      deps({
        providers: [
          fakeProvider({ name: "openai", data: { title: "A" } }),
          fakeProvider({ name: "groq", data: { title: "B" } }),
        ],
      }),
      { source: textSource("buy"), template, forced: "groq" },
    );
    expect(result.meta.provider).toBe("groq");
  });

  it("throws TemplateInvalid for a semantically broken template", async () => {
    await expect(
      extractInformation(deps(), {
        source: textSource("buy"),
        template: [{ name: "s", type: "enum", required: true }],
      }),
    ).rejects.toBeInstanceOf(TemplateInvalid);
  });

  it("throws NoProviderAvailable when none are available", async () => {
    await expect(
      extractInformation(
        deps({
          providers: [fakeProvider({ name: "openai", available: false })],
        }),
        { source: textSource("buy"), template },
      ),
    ).rejects.toBeInstanceOf(NoProviderAvailable);
  });

  it("throws InvalidProviderOutput when output has the wrong type", async () => {
    await expect(
      extractInformation(
        deps({
          providers: [
            fakeProvider({ name: "openai", data: { amount: "not a number" } }),
          ],
        }),
        { source: textSource("buy"), template },
      ),
    ).rejects.toBeInstanceOf(InvalidProviderOutput);
  });
});

describe("extractInformation (audio)", () => {
  it("transcribes audio then runs the same pipeline, persisting sourceType=audio", async () => {
    const repository = fakeRepository();
    const transcriber = fakeTranscriber({ text: "buy three teas" });
    const result = await extractInformation(
      deps({
        providers: [fakeProvider({ name: "openai", data: { title: "tea" } })],
        repository,
        transcriber,
      }),
      { source: audioSource(), template },
    );

    expect(transcriber.calls).toBe(1);
    expect(result.complete).toBe(true);
    expect(repository.saved[0].sourceType).toBe("audio");
    expect(repository.saved[0].inputText).toBe("buy three teas"); // transcript stored
  });

  it("throws TranscriptionUnavailable when no transcriber is configured", async () => {
    await expect(
      extractInformation(
        deps({ transcriber: fakeTranscriber({ available: false }) }),
        { source: audioSource(), template },
      ),
    ).rejects.toBeInstanceOf(TranscriptionUnavailable);
  });

  it("validates the template before transcribing (fail fast, no STT cost)", async () => {
    const transcriber = fakeTranscriber();
    await expect(
      extractInformation(deps({ transcriber }), {
        source: audioSource(),
        template: [{ name: "s", type: "enum", required: true }],
      }),
    ).rejects.toBeInstanceOf(TemplateInvalid);
    expect(transcriber.calls).toBe(0);
  });
});
