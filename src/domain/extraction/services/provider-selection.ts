import { NoProviderAvailable } from "@/domain/extraction/errors/no-provider-available";
import { ProviderError } from "@/domain/extraction/errors/provider-error";
import type {
  ExtractionInput,
  ExtractionOutput,
  ExtractionProvider,
} from "@/domain/extraction/ports/http/extraction-provider";

/**
 * Provider selection & fallback policy (pure, framework-free). See ADR 0004:
 * - `forced` (`?provider=`) forces one provider — **no fallback** to others.
 * - Otherwise providers are tried in `order`, skipping unavailable ones.
 * - **Only transient failures** trigger one retry and/or fallback; permanent failures
 *   stop immediately (they would fail the same way everywhere).
 * - No circuit breaker in v1.
 */

export interface ProviderSelectionOptions {
  /** Forced provider name from `?provider=`; disables fallback when set. */
  forced?: string;
  /** Preference order applied when no provider is forced. */
  order: string[];
}

export interface SelectionResult extends ExtractionOutput {
  /** Name of the provider that produced the result. */
  provider: string;
  /** True when an earlier preferred provider was skipped due to a transient failure. */
  fallbackUsed: boolean;
}

/** Calls a provider, retrying once on a transient failure; permanent errors propagate. */
async function attempt(
  provider: ExtractionProvider,
  input: ExtractionInput,
): Promise<ExtractionOutput> {
  let lastError: unknown;
  // Initial try + 1 retry.
  for (let tries = 0; tries < 2; tries++) {
    try {
      return await provider.extract(input);
    } catch (error) {
      lastError = error;
      if (!(error instanceof ProviderError) || !error.transient) {
        throw error; // permanent — do not retry
      }
    }
  }
  throw lastError; // still transient after the retry
}

function isTransient(error: unknown): boolean {
  return error instanceof ProviderError && error.transient;
}

/**
 * Resolves a provider and runs the extraction under the selection policy.
 * Throws `NoProviderAvailable` (forced unavailable / none available) or the last
 * `ProviderError` when every eligible provider fails transiently.
 */
export async function selectAndExtract(
  providers: ExtractionProvider[],
  input: ExtractionInput,
  options: ProviderSelectionOptions,
): Promise<SelectionResult> {
  const byName = new Map(providers.map((p) => [p.name, p]));

  if (options.forced) {
    const provider = byName.get(options.forced);
    if (!provider?.isAvailable()) {
      throw new NoProviderAvailable(options.forced);
    }
    const output = await attempt(provider, input);
    return { ...output, provider: provider.name, fallbackUsed: false };
  }

  const candidates = options.order
    .map((name) => byName.get(name))
    .filter((p): p is ExtractionProvider => !!p && p.isAvailable());

  if (candidates.length === 0) {
    throw new NoProviderAvailable();
  }

  let lastError: unknown;
  for (let i = 0; i < candidates.length; i++) {
    const provider = candidates[i];
    try {
      const output = await attempt(provider, input);
      return { ...output, provider: provider.name, fallbackUsed: i > 0 };
    } catch (error) {
      lastError = error;
      if (!isTransient(error)) {
        throw error; // permanent — no fallback
      }
      // transient — fall back to the next candidate
    }
  }

  throw lastError ?? new NoProviderAvailable();
}
