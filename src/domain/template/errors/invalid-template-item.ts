export class InvalidTemplateItem extends Error {
  constructor(public readonly issues: string[]) {
    super(
      `Invalid template item:\n${issues.map((issue) => `  - ${issue}`).join("\n")}`,
    );
    this.name = "InvalidTemplateItem";
  }
}
