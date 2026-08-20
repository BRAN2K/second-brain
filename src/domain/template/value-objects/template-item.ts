import { Guard } from "@/domain/shared/guard";
import { Issues } from "@/domain/shared/issues";
import { ValueObject } from "@/domain/shared/value-object";
import { TEMPLATE_BRN } from "@/domain/template/brn";
import { TemplateFieldKind } from "@/domain/template/enums/template-field-kind";
import { UnprocessableEntityError } from "@/libs/errors";

interface TemplateItemBase {
  name: string;
  required: boolean;
  rules?: string[];
  description?: string;
}

export interface NumberTemplateItem extends TemplateItemBase {
  kind: TemplateFieldKind.Number;
  default?: number;
}

export interface StringTemplateItem extends TemplateItemBase {
  kind: TemplateFieldKind.String;
  default?: string;
}

export interface BooleanTemplateItem extends TemplateItemBase {
  kind: TemplateFieldKind.Boolean;
  default?: boolean;
}

export interface DateTemplateItem extends TemplateItemBase {
  kind: TemplateFieldKind.Date;
  default?: string;
}

export interface EnumTemplateItem extends TemplateItemBase {
  kind: TemplateFieldKind.Enum;
  default?: string;
  values: string[]; // obrigatorio quando o kind for enum
}

export type TemplateItemProps =
  | NumberTemplateItem
  | StringTemplateItem
  | BooleanTemplateItem
  | DateTemplateItem
  | EnumTemplateItem;

export class TemplateItem extends ValueObject {
  readonly name: string;
  readonly kind: TemplateFieldKind;
  readonly required: boolean;
  readonly rules?: string[];
  readonly description?: string;
  readonly default?: string | number | boolean;
  readonly values?: string[];

  private constructor(props: TemplateItemProps) {
    super();
    this.name = props.name;
    this.kind = props.kind;
    this.required = props.required;
    this.rules = props.rules;
    this.description = props.description;
    this.default = props.default;
    this.values = props.kind === TemplateFieldKind.Enum ? props.values : undefined;
  }

  static create(props: TemplateItemProps): TemplateItem {
    const issues = new Issues();

    issues.add(Guard.againstEmptyString(props.name, "name"));

    if (props.kind === TemplateFieldKind.Enum) {
      issues.add(Guard.againstEmptyArray(props.values ?? [], "values"));
      issues.add(Guard.againstDuplicates(props.values ?? [], "values"));
    }

    if (props.default !== undefined) {
      issues.add(TemplateItem.defaultIssue(props));
    }

    if (issues.hasAny) {
      throw new UnprocessableEntityError(issues.all, {
        resource: TEMPLATE_BRN.resource,
        scope: TEMPLATE_BRN.scope.item,
      });
    }

    return new TemplateItem(props);
  }

  static reconstitute(props: TemplateItemProps): TemplateItem {
    return new TemplateItem(props);
  }

  toJSON(): TemplateItemProps {
    return { ...this } as TemplateItemProps;
  }

  private static defaultIssue(item: TemplateItemProps): string | null {
    switch (item.kind) {
      case TemplateFieldKind.Number:
        return Guard.againstWrongType(item.default, "number", "default");
      case TemplateFieldKind.String:
        return Guard.againstWrongType(item.default, "string", "default");
      case TemplateFieldKind.Boolean:
        return Guard.againstWrongType(item.default, "boolean", "default");
      case TemplateFieldKind.Date:
        return Guard.againstInvalidDateString(item.default, "default");
      case TemplateFieldKind.Enum:
        return Guard.againstValueNotInList(item.default, item.values, "default");
    }
  }
}
