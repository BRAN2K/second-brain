import { Guard } from "@/domain/shared/guard";
import { Issues } from "@/domain/shared/issues";
import { ValueObject } from "@/domain/shared/value-object";
import { TemplateFieldType } from "@/domain/template/enums/template-field-type";
import { InvalidTemplateItem } from "@/domain/template/errors/invalid-template-item";

interface TemplateItemTypeBase {
  rules?: string[];
}

export interface NumberItemType extends TemplateItemTypeBase {
  type: TemplateFieldType.Number;
  default?: number;
}

export interface StringItemType extends TemplateItemTypeBase {
  type: TemplateFieldType.String;
  default?: string;
}

export interface BooleanItemType extends TemplateItemTypeBase {
  type: TemplateFieldType.Boolean;
  default?: boolean;
}

export interface DateItemType extends TemplateItemTypeBase {
  type: TemplateFieldType.Date;
  default?: string;
}

export interface EnumItemType extends TemplateItemTypeBase {
  type: TemplateFieldType.Enum;
  default?: string;
  values: string[];
}

export type TemplateItemType =
  | NumberItemType
  | StringItemType
  | BooleanItemType
  | DateItemType
  | EnumItemType;

export interface TemplateItemProps {
  name: string;
  type: TemplateItemType;
  required: boolean;
  rules?: string[];
  description?: string;
}

export class TemplateItem extends ValueObject<TemplateItemProps> {
  private constructor(props: TemplateItemProps) {
    super(props);
  }

  static create(props: TemplateItemProps): TemplateItem {
    const issues = new Issues();

    issues.add(Guard.againstEmptyString(props.name, "name"));

    if (props.type.type === TemplateFieldType.Enum) {
      issues.add(Guard.againstEmptyArray(props.type.values ?? [], "values"));
      issues.add(Guard.againstDuplicates(props.type.values ?? [], "values"));
    }

    if (props.type.default !== undefined) {
      issues.add(defaultIssue(props.type));
    }

    if (issues.hasAny) {
      throw new InvalidTemplateItem(issues.all);
    }

    return new TemplateItem(props);
  }

  // Rows already passed create() on the way in; loading trusts the database.
  static reconstitute(props: TemplateItemProps): TemplateItem {
    return new TemplateItem(props);
  }

  get name(): string {
    return this.props.name;
  }
  get type(): TemplateItemType {
    return this.props.type;
  }
  get required(): boolean {
    return this.props.required;
  }
  get rules(): string[] | undefined {
    return this.props.rules;
  }
  get description(): string | undefined {
    return this.props.description;
  }

  toJSON(): TemplateItemProps {
    return { ...this.props };
  }
}

function defaultIssue(type: TemplateItemType): string | null {
  switch (type.type) {
    case TemplateFieldType.Number:
      return Guard.againstWrongType(type.default, "number", "default");
    case TemplateFieldType.String:
      return Guard.againstWrongType(type.default, "string", "default");
    case TemplateFieldType.Boolean:
      return Guard.againstWrongType(type.default, "boolean", "default");
    case TemplateFieldType.Date:
      return Guard.againstInvalidDateString(type.default, "default");
    case TemplateFieldType.Enum:
      return Guard.againstValueNotInList(type.default, type.values, "default");
  }
}
