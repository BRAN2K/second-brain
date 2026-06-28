import type {
  Template,
  TemplateField,
  TemplateItems,
  TemplateLeafType,
} from "@/domain/extraction/entities/template";
import { TemplateInvalid } from "@/domain/extraction/errors/template-invalid";

/**
 * Minimal JSON Schema we emit. Deliberately small: the template only allows leaf
 * types and arrays of leaves, so we never need `$ref`, nested objects, etc.
 */
export interface JsonSchema {
  type: "string" | "number" | "boolean" | "array";
  description?: string;
  format?: "date";
  enum?: string[];
  items?: JsonSchema;
}

/** A strict, canonical JSON Schema object describing the extraction result. */
export interface CanonicalSchema {
  type: "object";
  properties: Record<string, JsonSchema>;
  /** Real `required` list — used by `toProviderSchema` and as instruction. */
  required: string[];
  additionalProperties: false;
}

export interface TemplateSchema {
  /** Strict canonical schema (real `required`) — instructs the provider. */
  schema: CanonicalSchema;
  /**
   * Names of required fields, surfaced separately so the missingFields rule
   * (PR3) does not have to dig into the schema. Same set as `schema.required`.
   */
  required: string[];
}

const LEAF_TYPES: readonly TemplateLeafType[] = [
  "string",
  "number",
  "boolean",
  "date",
  "enum",
];

/** Builds the JSON Schema for a leaf type, validating `enum` values as it goes. */
function leafSchema(
  type: TemplateLeafType,
  values: string[] | undefined,
  label: string,
  issues: string[],
): JsonSchema {
  switch (type) {
    case "string":
      return { type: "string" };
    case "number":
      return { type: "number" };
    case "boolean":
      return { type: "boolean" };
    case "date":
      return { type: "string", format: "date" };
    case "enum": {
      if (!values || values.length === 0) {
        issues.push(`${label}: enum requires a non-empty "values" array`);
        return { type: "string" };
      }
      if (new Set(values).size !== values.length) {
        issues.push(`${label}: enum "values" must be unique`);
      }
      return { type: "string", enum: values };
    }
  }
}

function arrayItemSchema(
  field: TemplateField,
  issues: string[],
): JsonSchema | undefined {
  const items: TemplateItems | undefined = field.items;
  if (!items) {
    issues.push(`${field.name}: array requires an "items" descriptor`);
    return undefined;
  }
  if (!LEAF_TYPES.includes(items.type)) {
    issues.push(
      `${field.name}: array "items.type" must be one of ${LEAF_TYPES.join(", ")}`,
    );
    return undefined;
  }
  return leafSchema(items.type, items.values, `${field.name}.items`, issues);
}

/**
 * Converts the simple, flat template into a strict canonical JSON Schema plus the
 * list of required field names. Pure and framework-free. Throws `TemplateInvalid`
 * (collecting every issue) when the template makes no sense for extraction; the
 * HTTP edge validates shape, but the domain stays the source of truth.
 */
export function templateToSchema(template: Template): TemplateSchema {
  const issues: string[] = [];

  if (template.length === 0) {
    issues.push("template must have at least one field");
  }

  const properties: Record<string, JsonSchema> = {};
  const required: string[] = [];
  const seen = new Set<string>();

  for (const field of template) {
    const name = field.name?.trim();
    if (!name) {
      issues.push("every field must have a non-empty name");
      continue;
    }
    if (seen.has(name)) {
      issues.push(`${name}: duplicate field name`);
      continue;
    }
    seen.add(name);

    let schema: JsonSchema | undefined;
    if (field.type === "array") {
      const itemSchema = arrayItemSchema(field, issues);
      if (itemSchema) {
        schema = { type: "array", items: itemSchema };
      }
    } else if (LEAF_TYPES.includes(field.type)) {
      schema = leafSchema(field.type, field.values, name, issues);
    } else {
      issues.push(`${name}: unsupported type "${field.type}"`);
    }

    if (!schema) {
      continue;
    }
    if (field.description) {
      schema.description = field.description;
    }
    properties[name] = schema;
    if (field.required) {
      required.push(name);
    }
  }

  if (issues.length > 0) {
    throw new TemplateInvalid(issues);
  }

  return {
    schema: {
      type: "object",
      properties,
      required,
      additionalProperties: false,
    },
    required,
  };
}
