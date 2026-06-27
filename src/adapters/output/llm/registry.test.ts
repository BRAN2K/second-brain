import { describe, expect, it } from "bun:test";
import { fakeProvider } from "@test/helpers/fake-provider";
import { createProviderRegistry } from "@/adapters/output/llm/registry";

describe("createProviderRegistry", () => {
  const openai = fakeProvider({ name: "openai" });
  const gemini = fakeProvider({ name: "gemini", available: false });
  const order = ["openai", "gemini"];

  it("exposes all registered providers and the order", () => {
    const registry = createProviderRegistry([openai, gemini], order);
    expect(registry.all().map((p) => p.name)).toEqual(["openai", "gemini"]);
    expect(registry.order).toEqual(order);
  });

  it("filters available providers by isAvailable()", () => {
    const registry = createProviderRegistry([openai, gemini], order);
    expect(registry.available().map((p) => p.name)).toEqual(["openai"]);
  });

  it("looks up a provider by name", () => {
    const registry = createProviderRegistry([openai, gemini], order);
    expect(registry.get("gemini")).toBe(gemini);
    expect(registry.get("unknown")).toBeUndefined();
  });
});
