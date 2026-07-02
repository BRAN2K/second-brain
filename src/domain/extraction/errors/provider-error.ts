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
