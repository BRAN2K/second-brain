/**
 * The field types a template may declare. Leaf types describe a single value; `Array` is
 * a list of a leaf type (never nested). `TemplateLeafType` is the leaf-only subset, used
 * for an array's element type.
 */
export enum TemplateFieldType {
  String = "string",
  Number = "number",
  Boolean = "boolean",
  Date = "date",
  Enum = "enum",
  Array = "array",
}

export type TemplateLeafType = Exclude<
  TemplateFieldType,
  TemplateFieldType.Array
>;

export const LEAF_TYPES: readonly TemplateLeafType[] = [
  TemplateFieldType.String,
  TemplateFieldType.Number,
  TemplateFieldType.Boolean,
  TemplateFieldType.Date,
  TemplateFieldType.Enum,
];

/** Boundary guards: validate raw strings (HTTP/DB) before they become enum types. */
export function isTemplateFieldType(value: string): value is TemplateFieldType {
  return (Object.values(TemplateFieldType) as string[]).includes(value);
}

export function isTemplateLeafType(value: string): value is TemplateLeafType {
  return (LEAF_TYPES as string[]).includes(value);
}
