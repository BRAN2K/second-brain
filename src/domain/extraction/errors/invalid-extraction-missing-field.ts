export class InvalidExtractionMissingField extends Error {
  constructor(public readonly issues: string[]) {
    super(
      `Invalid extraction missing field:\n${issues.map((issue) => `  - ${issue}`).join("\n")}`,
    );
    this.name = "InvalidExtractionMissingField";
  }
}
