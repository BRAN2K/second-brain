import Ajv, { type ValidateFunction } from "ajv";
import type {
  CanonicalSchema,
  JsonSchema,
} from "@/domain/extraction/value-objects/canonical-schema";

/**
 * Structural validation of provider output, run in **"lenient"** mode.
 *
 * The canonical schema is strict (real `required`, `additionalProperties:false`); we
 * derive a lenient variant from it so that an **incomplete** extraction is never
 * rejected here: every field is made nullable and `required` is dropped. We still
 * check *types* (a number field returning a string is a real structural error) and
 * strip keys the template never asked for. "Required but absent" is not our concern —
 * that is the `missing-fields` rule, the single source of truth for completeness.
 */

export interface ValidationResult {
  /** Whether the output matched the (lenient) schema structurally. */
  valid: boolean;
  /** Output with unknown keys removed; the parsed value on failure. */
  data: unknown;
  /** Human-readable structural issues (empty when valid). */
  errors: string[];
}

/** Makes a leaf/array schema accept `null`, drop `format`, keep enum (+ null). */
function toLenient(schema: JsonSchema): Record<string, unknown> {
  if (schema.type === "array") {
    return {
      type: ["array", "null"],
      items: schema.items ? toLenient(schema.items) : {},
    };
  }
  if (schema.enum) {
    return { type: [schema.type, "null"], enum: [...schema.enum, null] };
  }
  return { type: [schema.type, "null"] };
}

/** Derives the lenient object schema from the strict canonical schema. */
function toLenientSchema(canonical: CanonicalSchema): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  for (const [name, prop] of Object.entries(canonical.properties)) {
    properties[name] = toLenient(prop);
  }
  return {
    type: "object",
    properties,
    additionalProperties: false,
  };
}

export interface OutputValidator {
  validate(canonical: CanonicalSchema, data: unknown): ValidationResult;
}

/**
 * Builds a reusable validator. `removeAdditional:"all"` strips keys not described by
 * the template (the schema sets `additionalProperties:false`); `coerceTypes` is off so
 * a wrong type is reported rather than silently fixed. Compiled schemas are cached.
 */
export function createOutputValidator(): OutputValidator {
  const ajv = new Ajv({
    allErrors: true,
    removeAdditional: "all",
    coerceTypes: false,
  });
  const cache = new WeakMap<CanonicalSchema, ValidateFunction>();

  return {
    validate(canonical, data) {
      let validateFn = cache.get(canonical);
      if (!validateFn) {
        validateFn = ajv.compile(toLenientSchema(canonical));
        cache.set(canonical, validateFn);
      }

      // removeAdditional mutates the validated value; clone to keep input intact.
      const candidate = structuredClone(data);
      const valid = validateFn(candidate);
      const errors = valid
        ? []
        : (validateFn.errors ?? []).map(
            (err) => `${err.instancePath || "/"} ${err.message}`,
          );

      return { valid, data: candidate, errors };
    },
  };
}
