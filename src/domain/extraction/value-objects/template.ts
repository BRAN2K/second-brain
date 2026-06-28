import {
  isTemplateFieldType,
  isTemplateLeafType,
  LEAF_TYPES,
  TemplateFieldType,
  type TemplateLeafType,
} from "@/domain/extraction/enums/template-field-type";
import { TemplateInvalid } from "@/domain/extraction/errors/template-invalid";
import type {
  CanonicalSchema,
  JsonSchema,
} from "@/domain/extraction/value-objects/canonical-schema";
import { ValueObject } from "@/domain/shared/value-object";

/** Raw field/items as they arrive from the HTTP edge or persistence (plain JSON). */
export interface RawTemplateItems {
  type: string;
  values?: string[];
}
export interface RawTemplateField {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  values?: string[];
  items?: RawTemplateItems;
}

interface TemplateItemsProps {
  type: TemplateLeafType;
  values?: string[];
}
export class TemplateItems extends ValueObject<TemplateItemsProps> {
  get type(): TemplateLeafType {
    return this.props.type;
  }
  get values(): string[] | undefined {
    return this.props.values;
  }
}

interface TemplateFieldProps {
  name: string;
  type: TemplateFieldType;
  required: boolean;
  description?: string;
  values?: string[];
  items?: TemplateItems;
}
export class TemplateField extends ValueObject<TemplateFieldProps> {
  get name(): string {
    return this.props.name;
  }
  get type(): TemplateFieldType {
    return this.props.type;
  }
  get required(): boolean {
    return this.props.required;
  }
  get description(): string | undefined {
    return this.props.description;
  }
  get values(): string[] | undefined {
    return this.props.values;
  }
  get items(): TemplateItems | undefined {
    return this.props.items;
  }
}

interface TemplateProps {
  fields: TemplateField[];
}

/**
 * A flat extraction template: a non-empty list of validated fields. `create()` is the
 * only way in — it enforces every semantic rule (unique non-empty names, `enum` needs
 * non-empty unique values, `array` needs valid leaf `items`), collecting **all** issues
 * and throwing `TemplateInvalid` once. The domain stays the source of truth; the HTTP
 * edge only guards structure. Once built, a Template is known-valid and immutable.
 */
export class Template extends ValueObject<TemplateProps> {
  private constructor(props: TemplateProps) {
    super(props);
  }

  static create(raw: RawTemplateField[]): Template {
    const issues: string[] = [];
    if (raw.length === 0) {
      issues.push("template must have at least one field");
    }

    const fields: TemplateField[] = [];
    const seen = new Set<string>();

    for (const rf of raw) {
      const name = rf.name?.trim();
      if (!name) {
        issues.push("every field must have a non-empty name");
        continue;
      }
      if (seen.has(name)) {
        issues.push(`${name}: duplicate field name`);
        continue;
      }
      seen.add(name);

      if (!isTemplateFieldType(rf.type)) {
        issues.push(`${name}: unsupported type "${rf.type}"`);
        continue;
      }
      const type = rf.type;

      let items: TemplateItems | undefined;
      if (type === TemplateFieldType.Array) {
        const built = buildItems(rf.items, name, issues);
        if (!built) {
          continue;
        }
        items = built;
      } else if (
        type === TemplateFieldType.Enum &&
        !validEnumValues(rf.values, name, issues)
      ) {
        continue;
      }

      fields.push(
        new TemplateField({
          name,
          type,
          required: rf.required,
          description: rf.description,
          values: rf.values,
          items,
        }),
      );
    }

    if (issues.length > 0) {
      throw new TemplateInvalid(issues);
    }
    return new Template({ fields });
  }

  get fields(): readonly TemplateField[] {
    return this.props.fields;
  }

  /** Plain snapshot for persistence (the `template` jsonb column). */
  toJSON(): RawTemplateField[] {
    return this.props.fields.map((f) => ({
      name: f.name,
      type: f.type,
      required: f.required,
      ...(f.description !== undefined ? { description: f.description } : {}),
      ...(f.values !== undefined ? { values: f.values } : {}),
      ...(f.items !== undefined
        ? {
            items: {
              type: f.items.type,
              ...(f.items.values !== undefined
                ? { values: f.items.values }
                : {}),
            },
          }
        : {}),
    }));
  }

  /** Names of the required fields, in declaration order. */
  get requiredNames(): string[] {
    return this.props.fields.filter((f) => f.required).map((f) => f.name);
  }

  /** Builds the strict canonical JSON Schema describing the extraction result. */
  toCanonicalSchema(): CanonicalSchema {
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];

    for (const field of this.props.fields) {
      let schema: JsonSchema;
      if (field.type === TemplateFieldType.Array && field.items) {
        schema = {
          type: "array",
          items: leafSchema(field.items.type, field.items.values),
        };
      } else {
        schema = leafSchema(field.type as TemplateLeafType, field.values);
      }
      if (field.description) {
        schema.description = field.description;
      }
      properties[field.name] = schema;
      if (field.required) {
        required.push(field.name);
      }
    }

    return {
      type: "object",
      properties,
      required,
      additionalProperties: false,
    };
  }

  /**
   * Required field names absent from `data` (order preserved). The source of truth for
   * "completeness" — never the provider, never structural validation. A required field is
   * missing when it is absent, null, or an empty/whitespace string; `0`, `false`, `[]`
   * are legitimate values, not missing.
   */
  findMissingFields(data: unknown): string[] {
    const record =
      data !== null && typeof data === "object"
        ? (data as Record<string, unknown>)
        : {};
    return this.requiredNames.filter((name) => isMissing(record[name]));
  }
}

function validEnumValues(
  values: string[] | undefined,
  label: string,
  issues: string[],
): boolean {
  if (!values || values.length === 0) {
    issues.push(`${label}: enum requires a non-empty "values" array`);
    return false;
  }
  if (new Set(values).size !== values.length) {
    issues.push(`${label}: enum "values" must be unique`);
    return false;
  }
  return true;
}

function buildItems(
  raw: RawTemplateItems | undefined,
  fieldName: string,
  issues: string[],
): TemplateItems | undefined {
  if (!raw) {
    issues.push(`${fieldName}: array requires an "items" descriptor`);
    return undefined;
  }
  if (!isTemplateLeafType(raw.type)) {
    issues.push(
      `${fieldName}: array "items.type" must be one of ${LEAF_TYPES.join(", ")}`,
    );
    return undefined;
  }
  if (
    raw.type === TemplateFieldType.Enum &&
    !validEnumValues(raw.values, `${fieldName}.items`, issues)
  ) {
    return undefined;
  }
  return new TemplateItems({ type: raw.type, values: raw.values });
}

function leafSchema(type: TemplateLeafType, values?: string[]): JsonSchema {
  switch (type) {
    case TemplateFieldType.String:
      return { type: "string" };
    case TemplateFieldType.Number:
      return { type: "number" };
    case TemplateFieldType.Boolean:
      return { type: "boolean" };
    case TemplateFieldType.Date:
      return { type: "string", format: "date" };
    case TemplateFieldType.Enum:
      return { type: "string", enum: values };
  }
}

function isMissing(value: unknown): boolean {
  if (value === undefined || value === null) {
    return true;
  }
  if (typeof value === "string") {
    return value.trim() === "";
  }
  return false;
}
