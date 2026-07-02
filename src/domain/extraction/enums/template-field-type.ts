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

export function isTemplateFieldType(value: string): value is TemplateFieldType {
  return (Object.values(TemplateFieldType) as string[]).includes(value);
}

export function isTemplateLeafType(value: string): value is TemplateLeafType {
  return (LEAF_TYPES as string[]).includes(value);
}
