export class InvalidTemplateSnapshot extends Error {
  constructor(public readonly issues: string[]) {
    super(`Invalid template snapshot:\n${issues.map((issue) => `  - ${issue}`).join("\n")}`);
    this.name = "InvalidTemplateSnapshot";
  }
}
