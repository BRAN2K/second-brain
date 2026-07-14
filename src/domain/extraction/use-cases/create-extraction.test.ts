import { describe, expect, it } from "bun:test";
import type { Extraction } from "@/domain/extraction/entities/extraction";
import { ExtractionSourceType } from "@/domain/extraction/enums/extraction-source-type";
import { InvalidExtraction } from "@/domain/extraction/errors/invalid-extraction";
import type {
  ExtractionFieldValue,
  ExtractionInput,
  ExtractionResult,
  IExtractionLLMProvider,
} from "@/domain/extraction/ports/extraction-llm-provider";
import type {
  ITranscriberLLMProvider,
  TranscriptionRequest,
  TranscriptionResult,
} from "@/domain/extraction/ports/transcriber-llm-provider";
import type {
  IExtractionRepository,
  ListExtractionsParams,
} from "@/domain/extraction/repositories/extraction";
import { Template } from "@/domain/template/entities/template";
import { TemplateFieldKind } from "@/domain/template/enums/template-field-kind";
import { TemplateNotFound } from "@/domain/template/errors/template-not-found";
import type {
  ITemplateRepository,
  ListTemplatesParams,
} from "@/domain/template/repositories/template";
import { TemplateItem } from "@/domain/template/value-objects/template-item";
import { CreateExtractionUseCase } from "./create-extraction";

function buildTemplate(): Template {
  return Template.create({
    name: "compra",
    description: "Template para extrair informações de compras",
    items: [
      TemplateItem.create({ name: "produto", kind: TemplateFieldKind.String, required: true }),
      TemplateItem.create({
        name: "quantidade",
        kind: TemplateFieldKind.Number,
        required: true,
        default: 1,
      }),
      TemplateItem.create({ name: "preco", kind: TemplateFieldKind.Number, required: true }),
      TemplateItem.create({ name: "local", kind: TemplateFieldKind.String, required: false }),
    ],
  });
}

class FakeTemplateRepository implements ITemplateRepository {
  constructor(private readonly templates: Template[]) {}

  async save(template: Template): Promise<Template> {
    return template;
  }

  async findById(id: string): Promise<Template | null> {
    return this.templates.find((template) => template.id === id) ?? null;
  }

  async list(_params: ListTemplatesParams): Promise<Template[]> {
    return this.templates;
  }
}

class FakeExtractionRepository implements IExtractionRepository {
  saved: Extraction[] = [];

  async save(extraction: Extraction): Promise<Extraction> {
    this.saved.push(extraction);
    return extraction;
  }

  async findById(_id: string): Promise<Extraction | null> {
    return null;
  }

  async list(_params: ListExtractionsParams): Promise<Extraction[]> {
    return this.saved;
  }
}

class FakeExtractionProvider implements IExtractionLLMProvider {
  calls: ExtractionInput[] = [];

  constructor(private readonly data: Record<string, ExtractionFieldValue>) {}

  async extract(input: ExtractionInput): Promise<ExtractionResult> {
    this.calls.push(input);
    return {
      data: this.data,
      provider: "fake",
      model: "fake-model",
      inputTokens: 10,
      outputTokens: 5,
    };
  }
}

class FakeTranscriber implements ITranscriberLLMProvider {
  calls: TranscriptionRequest[] = [];

  async transcribe(request: TranscriptionRequest): Promise<TranscriptionResult> {
    this.calls.push(request);
    return { text: "texto transcrito do audio", model: "fake-whisper", inputTokens: 3 };
  }
}

function buildUseCase(
  options: { template?: Template; providerData?: Record<string, ExtractionFieldValue> } = {},
) {
  const template = options.template ?? buildTemplate();
  const provider = new FakeExtractionProvider(
    options.providerData ?? { produto: "aspirador", preco: 359, local: "amazon" },
  );
  const extractionRepository = new FakeExtractionRepository();
  const transcriber = new FakeTranscriber();
  const useCase = new CreateExtractionUseCase(
    provider,
    extractionRepository,
    new FakeTemplateRepository([template]),
    transcriber,
  );

  return { useCase, template, provider, extractionRepository, transcriber };
}

describe("CreateExtractionUseCase", () => {
  it("extracts from text, applying defaults and reporting missing fields", async () => {
    const { useCase, template, provider, extractionRepository } = buildUseCase({
      providerData: { produto: "aspirador", local: "amazon", preco: null },
    });

    const extraction = await useCase.execute({
      sourceType: ExtractionSourceType.Text,
      templateId: template.id,
      inputText: "comprei um aspirador na amazon",
    });

    // quantidade absent -> default applied; preco null -> required missing
    expect(extraction.result).toEqual({ produto: "aspirador", local: "amazon", quantidade: 1 });
    expect(extraction.missingFields.map((field) => field.toJSON())).toEqual([
      { field: "quantidade", usedDefault: true },
      { field: "preco", usedDefault: false },
    ]);
    expect(extraction.complete).toBe(false);

    expect(extraction.templateId).toBe(template.id);
    expect(extraction.template.id).toBe(template.id);
    expect(extraction.provider).toBe("fake");
    expect(extraction.model).toBe("fake-model");
    expect(extraction.meta.inputTokens).toBe(10);
    expect(extraction.meta.outputTokens).toBe(5);

    expect(provider.calls[0]?.content).toBe("comprei um aspirador na amazon");
    expect(extractionRepository.saved).toHaveLength(1);
  });

  it("is complete when every field is extracted", async () => {
    const { useCase, template } = buildUseCase({
      providerData: { produto: "aspirador", quantidade: 2, preco: 359, local: "amazon" },
    });

    const extraction = await useCase.execute({
      sourceType: ExtractionSourceType.Text,
      templateId: template.id,
      inputText: "comprei 2 aspiradores",
    });

    expect(extraction.complete).toBe(true);
    expect(extraction.missingFields).toHaveLength(0);
  });

  it("ignores fields the template does not declare", async () => {
    const { useCase, template } = buildUseCase({
      providerData: { produto: "aspirador", quantidade: 1, preco: 359, alucinacao: "extra" },
    });

    const extraction = await useCase.execute({
      sourceType: ExtractionSourceType.Text,
      templateId: template.id,
      inputText: "comprei um aspirador",
    });

    expect(extraction.result).not.toHaveProperty("alucinacao");
  });

  it("transcribes audio before extracting", async () => {
    const { useCase, template, provider, transcriber } = buildUseCase({
      providerData: { produto: "aspirador", quantidade: 1, preco: 359 },
    });

    const file = new Blob(["fake-audio"], { type: "audio/wav" });
    const extraction = await useCase.execute({
      sourceType: ExtractionSourceType.Audio,
      templateId: template.id,
      file,
    });

    expect(transcriber.calls).toHaveLength(1);
    expect(extraction.inputText).toBe("texto transcrito do audio");
    expect(provider.calls[0]?.content).toBe("texto transcrito do audio");
  });

  it("throws TemplateNotFound for an unknown template", () => {
    const { useCase } = buildUseCase();

    expect(
      useCase.execute({
        sourceType: ExtractionSourceType.Text,
        templateId: "missing-id",
        inputText: "qualquer texto",
      }),
    ).rejects.toThrow(TemplateNotFound);
  });

  it("rejects audio requests without a file", () => {
    const { useCase, template } = buildUseCase();

    expect(
      useCase.execute({ sourceType: ExtractionSourceType.Audio, templateId: template.id }),
    ).rejects.toThrow(InvalidExtraction);
  });

  it("rejects text requests without inputText", () => {
    const { useCase, template } = buildUseCase();

    expect(
      useCase.execute({ sourceType: ExtractionSourceType.Text, templateId: template.id }),
    ).rejects.toThrow(InvalidExtraction);
  });
});
