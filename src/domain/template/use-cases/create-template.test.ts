import { describe, expect, it } from "bun:test";
import type { Template } from "@/domain/template/entities/template";
import { TemplateFieldKind } from "@/domain/template/enums/template-field-kind";
import { InvalidTemplateItem } from "@/domain/template/errors/invalid-template-item";
import { TemplateInvalid } from "@/domain/template/errors/template-invalid";
import type {
  ITemplateRepository,
  ListTemplatesParams,
} from "@/domain/template/repositories/template";
import { type CreateTemplateInput, CreateTemplateUseCase } from "./create-template";

class FakeTemplateRepository implements ITemplateRepository {
  saved: Template[] = [];

  async save(template: Template): Promise<Template> {
    this.saved.push(template);
    return template;
  }

  async findById(id: string): Promise<Template | null> {
    return this.saved.find((template) => template.id === id) ?? null;
  }

  async list(_params: ListTemplatesParams): Promise<Template[]> {
    return this.saved;
  }
}

const validInput = {
  name: "compra",
  description: "Template para extrair informações de compras",
  items: [
    { name: "produto", kind: TemplateFieldKind.String, required: true },
    { name: "quantidade", kind: TemplateFieldKind.Number, required: true, default: 1 },
  ],
  rules: ["regra do template"],
} satisfies CreateTemplateInput;

describe("CreateTemplateUseCase", () => {
  it("creates and persists a valid template", async () => {
    const repository = new FakeTemplateRepository();
    const useCase = new CreateTemplateUseCase(repository);

    const template = await useCase.execute(validInput);

    expect(repository.saved).toHaveLength(1);
    expect(template.name).toBe("compra");
    expect(template.items).toHaveLength(2);
    expect(template.items[1]?.default).toBe(1);
    expect(template.rules).toEqual(["regra do template"]);
  });

  it("rejects an invalid item and does not persist", async () => {
    const repository = new FakeTemplateRepository();
    const useCase = new CreateTemplateUseCase(repository);

    const input: CreateTemplateInput = {
      ...validInput,
      items: [{ name: "pagamento", kind: TemplateFieldKind.Enum, required: true, values: [] }],
    };

    expect(useCase.execute(input)).rejects.toThrow(InvalidTemplateItem);
    expect(repository.saved).toHaveLength(0);
  });

  it("rejects template-level violations, accumulating all issues", async () => {
    const repository = new FakeTemplateRepository();
    const useCase = new CreateTemplateUseCase(repository);

    const input: CreateTemplateInput = {
      name: " ",
      description: "desc",
      items: [
        { name: "produto", kind: TemplateFieldKind.String, required: true },
        { name: "produto", kind: TemplateFieldKind.String, required: false },
      ],
    };

    try {
      await useCase.execute(input);
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(TemplateInvalid);
      expect((error as TemplateInvalid).issues).toEqual([
        "name must not be empty",
        "item names must not contain duplicates",
      ]);
    }
  });
});
