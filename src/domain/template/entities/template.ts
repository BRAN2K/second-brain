import type { EntityProps } from "@/domain/core/entity";
import type { TemplateItem } from "@/domain/template/value-objects/template-item";
import { uuidv7 } from "uuidv7";
import { AggregateRoot } from "@/domain/core/aggregate-root";
import { Guard } from "@/domain/core/guard";
import { Issues } from "@/domain/core/issues";
import { TEMPLATE_BRN } from "@/domain/template/brn";
import { UnprocessableEntityError } from "@/libs/errors";

interface TemplateProps extends EntityProps {
  name: string;
  description: string;
  items: TemplateItem[];
  rules: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateTemplateProps {
  name: string;
  description: string;
  items: TemplateItem[];
  rules?: string[];
}

export class Template extends AggregateRoot {
  readonly createdAt: Date;

  private _name: string;
  private _description: string;
  private _items: TemplateItem[];
  private _rules: string[];
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  private constructor(props: TemplateProps) {
    super(props);
    this._name = props.name;
    this._description = props.description;
    this._items = props.items;
    this._rules = props.rules;
    this.createdAt = new Date(props.createdAt);
    this._updatedAt = new Date(props.updatedAt);
    this._deletedAt = props.deletedAt ? new Date(props.deletedAt) : null;
  }

  static create(input: CreateTemplateProps): Template {
    const issues = new Issues();

    issues.add(Guard.againstEmptyString(input.name, "name"));
    issues.add(Guard.againstEmptyString(input.description, "description"));
    issues.add(Guard.againstEmptyArray(input.items, "items"));
    issues.add(
      Guard.againstDuplicates(
        input.items.map((item) => item.name),
        "item names",
      ),
    );

    if (issues.hasAny) {
      throw new UnprocessableEntityError(issues.all, { resource: TEMPLATE_BRN.resource });
    }

    const now = new Date();

    return new Template({
      id: uuidv7(),
      name: input.name,
      description: input.description,
      items: input.items,
      rules: input.rules ?? [],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  static reconstitute(props: TemplateProps): Template {
    return new Template(props);
  }

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get items(): readonly TemplateItem[] {
    return this._items;
  }

  get rules(): readonly string[] {
    return this._rules;
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  get deletedAt(): Date | null {
    return this._deletedAt ? new Date(this._deletedAt) : null;
  }

  rename(name: string): void {
    const issue = Guard.againstEmptyString(name, "name");

    if (issue) {
      throw new UnprocessableEntityError([issue], { resource: TEMPLATE_BRN.resource });
    }

    const now = new Date();
    this._name = name;
    this._updatedAt = now;
  }

  softDelete(): void {
    if (this._deletedAt) {
      return;
    }

    const now = new Date();
    this._deletedAt = now;
    this._updatedAt = now;
  }
}
