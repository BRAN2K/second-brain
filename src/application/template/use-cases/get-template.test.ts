import type {
  ITemplateRepository,
  ListTemplatesParams,
  TemplatesPage,
} from "@/domain/template/repositories/template";
import { describe, expect, it } from "bun:test";
import { Template } from "@/domain/template/entities/template";
import { TemplateFieldKind } from "@/domain/template/enums/template-field-kind";
import { TemplateItem } from "@/domain/template/value-objects/template-item";
import { NotFoundError } from "@/libs/errors";
import { GetTemplateUseCase } from "./get-template";

function buildTemplate(): Template {
  return Template.create({
    name: "compra",
    description: "desc",
    items: [
      TemplateItem.create({ name: "produto", kind: TemplateFieldKind.String, required: true }),
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

  async list(_params: ListTemplatesParams): Promise<TemplatesPage> {
    return { templates: this.templates, hasNext: false };
  }
}

describe("GetTemplateUseCase", () => {
  it("returns the template when it exists", async () => {
    const template = buildTemplate();
    const useCase = new GetTemplateUseCase(new FakeTemplateRepository([template]));

    expect(await useCase.execute(template.id)).toBe(template);
  });

  it("throws NotFoundError when it does not exist", () => {
    const useCase = new GetTemplateUseCase(new FakeTemplateRepository([]));

    expect(useCase.execute("missing-id")).rejects.toThrow(NotFoundError);
  });
});
