import { describe, expect, it } from "bun:test";
import { ValueObject } from "@/domain/core/value-object";

class ValueObjectStub extends ValueObject {
  constructor(
    readonly amount: number,
    readonly currency: string,
  ) {
    super();
  }
}

class OtherValueObjectStub extends ValueObject {
  constructor(
    readonly amount: number,
    readonly currency: string,
  ) {
    super();
  }
}

describe("core value object", () => {
  it("should equate instances of the same class with equal values", () => {
    expect(new ValueObjectStub(10, "BRL").equals(new ValueObjectStub(10, "BRL"))).toBe(true);
  });

  it("should distinguish instances with different values", () => {
    expect(new ValueObjectStub(10, "BRL").equals(new ValueObjectStub(11, "BRL"))).toBe(false);
  });

  it("should equate with itself", () => {
    const value = new ValueObjectStub(10, "BRL");
    expect(value.equals(value)).toBe(true);
  });

  it("should distinguish instances of different classes", () => {
    expect(new ValueObjectStub(10, "BRL").equals(new OtherValueObjectStub(10, "BRL"))).toBe(false);
  });
});
