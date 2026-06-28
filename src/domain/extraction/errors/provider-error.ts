/**
 * Raised by a provider adapter when an extraction call fails. `transient` drives the
 * selection policy: transient failures (timeout, 5xx, 429) are eligible for one retry
 * and for fallback to the next provider; permanent failures stop immediately, since
 * they would fail the same way everywhere.
 */
export class ProviderError extends Error {
  constructor(
    public readonly provider: string,
    public readonly transient: boolean,
    options?: { cause?: unknown },
  ) {
    super(
      `Provider "${provider}" failed (${transient ? "transient" : "permanent"})`,
      options,
    );
    this.name = "ProviderError";
  }
}
