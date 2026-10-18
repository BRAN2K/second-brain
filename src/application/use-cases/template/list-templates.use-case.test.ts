import type { Template } from "@/domain/template/entities/template.aggregate";
import type {
  ITemplateRepository,
  ListTemplatesParams,
  TemplatesPage,
} from "@/domain/template/repositories/template.repository";
import { describe, expect, it } from "bun:test";
import { ListTemplatesUseCase } from "@/application/use-cases/template/list-templates.use-case";
import { makeTemplate } from "@/test/factories/domain/template.aggregate.factory";

class FakeTemplateRepository implements ITemplateRepository {
  calls: ListTemplatesParams[] = [];

  async save(template: Template): Promise<Template> {
    return template;
  }

  async findById(_id: string): Promise<Template | null> {
    return null;
  }

  async list(params: ListTemplatesParams): Promise<TemplatesPage> {
    this.calls.push(params);
    return { templates: [makeTemplate()], hasNext: false };
  }
}

describe("ListTemplatesUseCase", () => {
  it("applies the default limit when none is provided", async () => {
    const repository = new FakeTemplateRepository();
    const useCase = new ListTemplatesUseCase(repository);

    const page = await useCase.execute();

    expect(repository.calls).toEqual([{ cursor: undefined, limit: 20 }]);
    expect(page.templates).toHaveLength(1);
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
