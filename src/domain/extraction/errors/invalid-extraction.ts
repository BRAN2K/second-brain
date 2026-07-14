export class InvalidExtraction extends Error {
  constructor(public readonly issues: string[]) {
    super(`Invalid extraction:\n${issues.map((issue) => `  - ${issue}`).join("\n")}`);
    this.name = "InvalidExtraction";
  }
}
