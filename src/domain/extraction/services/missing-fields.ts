/**
 * The signature rule of the API: given the required field names (from
 * `template-to-schema`) and the extracted data, report which required fields the
 * extraction could not fill. This is the source of truth for "completeness" — never
 * the provider, never the structural (Ajv) validation. Pure and framework-free.
 *
 * A required field counts as missing when it is **absent**, **null**, or an **empty
 * string** (including whitespace-only). Other falsy-but-meaningful values (`0`,
 * `false`, `[]`) are NOT missing — they are legitimate extracted values.
 */

function isMissing(value: unknown): boolean {
  if (value === undefined || value === null) {
    return true;
  }
  if (typeof value === "string") {
    return value.trim() === "";
  }
  return false;
}

/** Returns the required field names absent from `data`, preserving their order. */
export function findMissingFields(required: string[], data: unknown): string[] {
  const record =
    data !== null && typeof data === "object"
      ? (data as Record<string, unknown>)
      : {};
  return required.filter((name) => isMissing(record[name]));
}
