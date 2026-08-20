import { describe, expect, it } from "bun:test";
import { Guard } from "@/domain/core/guard";

describe("core guard", () => {
  it("should reject empty and whitespace-only strings", () => {
    expect(Guard.againstEmptyString("", "name")).toBe("name must not be empty");
    expect(Guard.againstEmptyString("   ", "name")).toBe("name must not be empty");
    expect(Guard.againstEmptyString("ok", "name")).toBeNull();
  });

  it("should reject empty arrays", () => {
    expect(Guard.againstEmptyArray([], "items")).toBe("items must not be empty");
    expect(Guard.againstEmptyArray(["a"], "items")).toBeNull();
  });

  it("should reject duplicates", () => {
    expect(Guard.againstDuplicates(["a", "a"], "fields")).toBe(
      "fields must not contain duplicates",
    );
    expect(Guard.againstDuplicates(["a", "b", "b", "c"], "fields")).toBe(
      "fields must not contain duplicates",
    );
    expect(Guard.againstDuplicates(["a", "b"], "fields")).toBeNull();
  });

  it("should validate membership in a list", () => {
    expect(Guard.againstValueNotInList("x", ["a", "b"], "kind")).toBe("kind must be one of: a, b");
    expect(Guard.againstValueNotInList("a", ["a", "b"], "kind")).toBeNull();
    expect(Guard.againstValueNotInList("a", [], "kind")).toBe("kind must be one of: ");
  });

  it("should validate types", () => {
    expect(Guard.againstWrongType("1", "number", "count")).toBe("count must be a number");
    expect(Guard.againstWrongType(1, "number", "count")).toBeNull();
    expect(Guard.againstWrongType(1, "string", "name")).toBe("name must be a string");
    expect(Guard.againstWrongType("1", "string", "name")).toBeNull();
    expect(Guard.againstWrongType("true", "boolean", "flag")).toBe("flag must be a boolean");
    expect(Guard.againstWrongType(true, "boolean", "flag")).toBeNull();
    expect(Guard.againstWrongType(undefined, "string", "name")).toBe("name must be a string");
  });

  it("should validate date strings", () => {
    expect(Guard.againstInvalidDateString("not-a-date", "date")).toBe(
      "date must be a valid date string",
    );
    expect(Guard.againstInvalidDateString("", "date")).toBe("date must be a valid date string");
    expect(Guard.againstInvalidDateString("2026-08-19", "date")).toBeNull();
    expect(Guard.againstInvalidDateString(123, "date")).toBe("date must be a valid date string");
  });
});
