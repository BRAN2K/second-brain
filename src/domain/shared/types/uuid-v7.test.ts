import { describe, expect, it } from "bun:test";
import { generateUuidV7, isUuidV7 } from "@/domain/shared/types/uuid-v7";

describe("uuid-v7", () => {
  it("generates ids that validate as v7", () => {
    for (let i = 0; i < 100; i++) {
      expect(isUuidV7(generateUuidV7())).toBe(true);
    }
  });

  it("encodes version 7 and the RFC variant", () => {
    const id = generateUuidV7();
    expect(id[14]).toBe("7"); // version nibble
    expect("89ab").toContain(id[19].toLowerCase()); // variant nibble
  });

  it("is time-ordered: later ids sort after earlier ones", async () => {
    const first = generateUuidV7();
    await Bun.sleep(2);
    const second = generateUuidV7();
    expect(first < second).toBe(true);
  });

  it("rejects non-v7 strings", () => {
    expect(isUuidV7("not-a-uuid")).toBe(false);
    // A valid v4 uuid (version nibble 4) must be rejected.
    expect(isUuidV7("9b2e4c1a-1f3d-4a2b-8c7d-0e1f2a3b4c5d")).toBe(false);
  });
});
