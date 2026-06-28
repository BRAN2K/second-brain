/**
 * The strict, canonical JSON Schema the domain emits from a `Template` to instruct the
 * provider and drive lenient validation. Kept as plain serializable shapes (not a class):
 * providers send it over HTTP to the LLM and the Ajv adapter compiles it directly, so a
 * VO wrapper would only be unwrapped at every use site. Treat it as an immutable value.
 *
 * Deliberately minimal: the template only allows leaf types and arrays of leaves, so we
 * never need `$ref`, nested objects, etc.
 */
export interface JsonSchema {
  type: "string" | "number" | "boolean" | "array";
  description?: string;
  format?: "date";
  enum?: string[];
  items?: JsonSchema;
}

export interface CanonicalSchema {
  type: "object";
  properties: Record<string, JsonSchema>;
  /** Real `required` list — instructs the provider and feeds validation. */
  required: string[];
  additionalProperties: false;
}
