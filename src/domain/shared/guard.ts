export const Guard = {
  againstEmptyString(value: string, field: string): string | null {
    return value.trim() === "" ? `${field} must not be empty` : null;
  },

  againstEmptyArray(value: readonly unknown[], field: string): string | null {
    return value.length === 0 ? `${field} must not be empty` : null;
  },

  againstDuplicates(values: readonly string[], field: string): string | null {
    return new Set(values).size !== values.length
      ? `${field} must not contain duplicates`
      : null;
  },

  againstValueNotInList(
    value: string,
    list: readonly string[],
    field: string,
  ): string | null {
    return list.includes(value)
      ? null
      : `${field} must be one of: ${list.join(", ")}`;
  },

  againstWrongType(
    value: unknown,
    expected: "number" | "string" | "boolean",
    field: string,
  ): string | null {
    return typeof value === expected ? null : `${field} must be a ${expected}`;
  },

  againstInvalidDateString(value: unknown, field: string): string | null {
    return typeof value === "string" && !Number.isNaN(Date.parse(value))
      ? null
      : `${field} must be a valid date string`;
  },
};
