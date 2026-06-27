import { describe, expect, it } from "bun:test";
import {
  isTransientStatus,
  providerErrorFromStatus,
} from "@/adapters/output/llm/errors";
import { ProviderError } from "@/domain/extraction/errors/provider-error";

describe("isTransientStatus", () => {
  it("treats 408 / 429 / 5xx as transient", () => {
    for (const status of [408, 429, 500, 502, 503, 504]) {
      expect(isTransientStatus(status)).toBe(true);
    }
  });

  it("treats 4xx (except 408/429) as permanent", () => {
    for (const status of [400, 401, 403, 404, 422]) {
      expect(isTransientStatus(status)).toBe(false);
    }
  });
});

describe("providerErrorFromStatus", () => {
  it("builds a transient ProviderError for a 503", () => {
    const error = providerErrorFromStatus("groq", 503, "down");
    expect(error).toBeInstanceOf(ProviderError);
    expect(error.provider).toBe("groq");
    expect(error.transient).toBe(true);
  });

  it("builds a permanent ProviderError for a 400", () => {
    expect(providerErrorFromStatus("openai", 400).transient).toBe(false);
  });
});
