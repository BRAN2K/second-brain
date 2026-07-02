export class InvalidProviderOutput extends Error {
  constructor(
    public readonly provider: string,
    public readonly issues: string[],
  ) {
    super(`Provider "${provider}" returned structurally invalid output`);
    this.name = "InvalidProviderOutput";
  }
}
