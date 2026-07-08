export class ProviderError extends Error {
  constructor(
    public readonly provider: string,
    options?: { cause?: unknown },
  ) {
    super(`Provider "${provider}" failed`, options);
    this.name = "ProviderError";
  }
}
