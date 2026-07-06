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

// Dates travel as ISO strings (jsonb/HTTP safe).
export interface DateItemType extends TemplateItemTypeBase {
  type: TemplateFieldType.Date;
  default?: string;
}

export interface EnumItemType extends TemplateItemTypeBase {
  type: TemplateFieldType.Enum;
  default?: string;
  values: string[]; // obrigatorio quando o type for enum
}

// Discriminated on `type`: each variant types its own `default`, and only the
// enum variant carries `values`.
export type TemplateItemTypeProps =
  | NumberItemType
  | StringItemType
  | BooleanItemType
  | DateItemType
  | EnumItemType;

export interface TemplateItemProps {
  name: string;
  type: TemplateItemTypeProps;
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
  get type(): TemplateItemTypeProps {
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

function defaultIssue(type: TemplateItemTypeProps): string | null {
  function enumDefaultIssue(type: EnumItemType): string | null {
    if (typeof type.default !== "string") {
      return Guard.againstWrongType(type.default, "string", "default");
    }

    return Guard.againstValueNotInList(type.default, type.values, "default");
  }

  const defaultValidators: Record<TemplateFieldType, () => string | null> = {
    [TemplateFieldType.Number]: () =>
      Guard.againstWrongType(type.default, "number", "default"),
    [TemplateFieldType.String]: () =>
      Guard.againstWrongType(type.default, "string", "default"),
    [TemplateFieldType.Boolean]: () =>
      Guard.againstWrongType(type.default, "boolean", "default"),
    [TemplateFieldType.Date]: () =>
      Guard.againstInvalidDateString(type.default, "default"),
    [TemplateFieldType.Enum]: () => enumDefaultIssue(type as EnumItemType),
  };

  return defaultValidators[type.type]();
}
