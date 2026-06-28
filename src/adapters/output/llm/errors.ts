import { ProviderError } from "@/domain/extraction/errors/provider-error";

/**
 * Maps an HTTP status to the transient/permanent classification the selection policy
 * relies on. Transient (retry + fallback eligible): request timeout (408), rate limit
 * (429), and any 5xx. Everything else (4xx like 400/401/403/404) is permanent — it
 * would fail the same way on a retry or another provider.
 */
export function isTransientStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

/** Builds a `ProviderError` from an HTTP response status. */
export function providerErrorFromStatus(
  provider: string,
  status: number,
  body?: string,
): ProviderError {
  return new ProviderError(provider, isTransientStatus(status), {
    cause: body,
  });
}
