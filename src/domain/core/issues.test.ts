import { describe, expect, it } from "bun:test";
import { Issues } from "@/domain/core/issues";

describe("core issues", () => {
  it("should start empty", () => {
    expect(new Issues().hasAny).toBe(false);
    expect(new Issues().all).toEqual([]);
  });

  it("should add issues and report them", () => {
    const issues = new Issues();
    issues.add("boom");
    expect(issues.hasAny).toBe(true);
    expect(issues.all).toEqual(["boom"]);
  });

  it("should ignore null additions", () => {
    const issues = new Issues();
    issues.add(null);
    expect(issues.hasAny).toBe(false);
    expect(issues.all).toEqual([]);
  });

  it("should accumulate multiple issues", () => {
    const issues = new Issues();
    issues.add("a").add("b");
    expect(issues.all).toEqual(["a", "b"]);
  });

  it("should return a copy of the issues", () => {
    const issues = new Issues();
    issues.add("boom");
    const all = issues.all;
    all.push("mutated");
    expect(issues.all).toEqual(["boom"]);
  });
});
