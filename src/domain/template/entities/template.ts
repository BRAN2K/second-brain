import { uuidv7 } from "uuidv7";
import { AggregateRoot } from "@/domain/shared/aggregate-root";
import { Guard } from "@/domain/shared/guard";
import { Issues } from "@/domain/shared/issues";
import { TemplateInvalid } from "@/domain/template/errors/template-invalid";
import type { TemplateItem } from "@/domain/template/value-objects/template-item";

interface TemplateProps {
  name: string;
  description: string | null;
  items: TemplateItem[];
  rules: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateTemplateProps {
  name: string;
  description?: string;
  items: TemplateItem[];
  rules?: string[];
}

export interface ReconstituteTemplateProps extends TemplateProps {
  id: string;
}

export class Template extends AggregateRoot<string> {
  private readonly props: TemplateProps;

  private constructor(id: string, props: TemplateProps) {
    super(id);
    this.props = props;
  }

  static create(input: CreateTemplateProps): Template {
    const issues = new Issues();

    issues.add(Guard.againstEmptyString(input.name, "name"));
    issues.add(Guard.againstEmptyArray(input.items, "items"));
    issues.add(
      Guard.againstDuplicates(
        input.items.map((item) => item.name),
        "item names",
      ),
    );

    if (issues.hasAny) {
      throw new TemplateInvalid(issues.all);
    }

    const now = new Date();

    return new Template(uuidv7(), {
      name: input.name,
      description: input.description ?? null,
      items: input.items,
      rules: input.rules ?? [],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  static reconstitute(input: ReconstituteTemplateProps): Template {
    const { id, ...props } = input;
    return new Template(id, props);
  }

  get name(): string {
    return this.props.name;
  }
  get description(): string | null {
    return this.props.description;
  }
  get items(): TemplateItem[] {
    return this.props.items;
  }
  get rules(): string[] {
    return this.props.rules;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }
}
