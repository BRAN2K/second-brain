import { describe, expect, it } from "bun:test";
import { Entity } from "@/domain/core/entity";

class EntityStub extends Entity {
  constructor(id: string) {
    super({ id });
  }
}

class OtherEntityStub extends Entity {
  constructor(id: string) {
    super({ id });
  }
}

describe("core entity", () => {
  it("should store the given id", () => {
    expect(new EntityStub("42").id).toBe("42");
  });

  it("should equate entities with the same id", () => {
    expect(new EntityStub("1").equals(new EntityStub("1"))).toBe(true);
  });

  it("should distinguish entities with different ids", () => {
    expect(new EntityStub("1").equals(new EntityStub("2"))).toBe(false);
  });

  it("should equate with itself", () => {
    const entity = new EntityStub("1");
    expect(entity.equals(entity)).toBe(true);
  });

  it("should equate across subclasses with the same id", () => {
    expect(new EntityStub("1").equals(new OtherEntityStub("1"))).toBe(true);
  });
});
