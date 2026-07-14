import { describe, expect, it } from "bun:test";
import { Template } from "@/domain/template/entities/template";
import { TemplateFieldKind } from "@/domain/template/enums/template-field-kind";
import type {
  ITemplateRepository,
  ListTemplatesParams,
} from "@/domain/template/repositories/template";
import { ListTemplatesUseCase } from "@/domain/template/use-cases/list-templates";
import { TemplateItem } from "@/domain/template/value-objects/template-item";

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
  calls: ListTemplatesParams[] = [];

  async save(template: Template): Promise<Template> {
    return template;
  }

  async findById(_id: string): Promise<Template | null> {
    return null;
  }

  async list(params: ListTemplatesParams): Promise<Template[]> {
    this.calls.push(params);
    return [buildTemplate()];
  }
}

describe("ListTemplatesUseCase", () => {
  it("applies the default limit when none is provided", async () => {
    const repository = new FakeTemplateRepository();
    const useCase = new ListTemplatesUseCase(repository);

    const templates = await useCase.execute();

    expect(repository.calls).toEqual([{ cursor: undefined, limit: 20 }]);
    expect(templates).toHaveLength(1);
  });

  it("forwards the cursor and a limit under the max as-is", async () => {
    const repository = new FakeTemplateRepository();
    const useCase = new ListTemplatesUseCase(repository);

    await useCase.execute({ cursor: "abc", limit: 50 });

    expect(repository.calls).toEqual([{ cursor: "abc", limit: 50 }]);
  });

  it("caps the limit at the maximum allowed", async () => {
    const repository = new FakeTemplateRepository();
    const useCase = new ListTemplatesUseCase(repository);

    await useCase.execute({ limit: 500 });

    expect(repository.calls).toEqual([{ cursor: undefined, limit: 100 }]);
  });
});
