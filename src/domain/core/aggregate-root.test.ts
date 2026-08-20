import { describe, expect, it } from "bun:test";
import { AggregateRoot } from "@/domain/core/aggregate-root";

class AggregateRootStub extends AggregateRoot {
  constructor(id: string) {
    super({ id });
  }
}

describe("core aggregate root", () => {
  it("should store the given id", () => {
    expect(new AggregateRootStub("42").id).toBe("42");
  });

  it("should equate by id like an entity", () => {
    expect(new AggregateRootStub("1").equals(new AggregateRootStub("1"))).toBe(true);
    expect(new AggregateRootStub("1").equals(new AggregateRootStub("2"))).toBe(false);
  });
});
