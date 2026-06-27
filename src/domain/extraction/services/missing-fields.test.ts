import { describe, expect, it } from "bun:test";
import { findMissingFields } from "@/domain/extraction/services/missing-fields";

describe("findMissingFields", () => {
  it("returns nothing when all required fields are present", () => {
    expect(findMissingFields(["a", "b"], { a: "x", b: 1, c: "extra" })).toEqual(
      [],
    );
  });

  it("flags absent required fields", () => {
    expect(findMissingFields(["a", "b"], { a: "x" })).toEqual(["b"]);
  });

  it("flags null as missing", () => {
    expect(findMissingFields(["a"], { a: null })).toEqual(["a"]);
  });

  it("flags empty string as missing", () => {
    expect(findMissingFields(["a"], { a: "" })).toEqual(["a"]);
  });

  it("flags whitespace-only string as missing", () => {
    expect(findMissingFields(["a"], { a: "   " })).toEqual(["a"]);
  });

  it("does NOT flag 0 / false / empty array (legitimate values)", () => {
    expect(
      findMissingFields(["n", "b", "arr"], { n: 0, b: false, arr: [] }),
    ).toEqual([]);
  });

  it("ignores non-required fields entirely", () => {
    // empty required list => nothing is ever missing
    expect(findMissingFields([], { a: null })).toEqual([]);
  });

  it("preserves the order of the required list", () => {
    expect(findMissingFields(["z", "a", "m"], {})).toEqual(["z", "a", "m"]);
  });

  it("treats non-object data as everything missing", () => {
    expect(findMissingFields(["a", "b"], null)).toEqual(["a", "b"]);
    expect(findMissingFields(["a"], "not an object")).toEqual(["a"]);
  });
});
