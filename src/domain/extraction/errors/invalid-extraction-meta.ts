export class InvalidExtractionMeta extends Error {
  constructor(public readonly issues: string[]) {
    super(`Invalid extraction meta:\n${issues.map((issue) => `  - ${issue}`).join("\n")}`);
    this.name = "InvalidExtractionMeta";
  }
}
