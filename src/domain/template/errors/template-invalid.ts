export class TemplateInvalid extends Error {
  constructor(public readonly issues: string[]) {
    super(
      `Invalid template:\n${issues.map((issue) => `  - ${issue}`).join("\n")}`,
    );
    this.name = "TemplateInvalid";
  }
}
