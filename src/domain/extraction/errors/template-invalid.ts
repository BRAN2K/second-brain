/**
 * Raised when a template is structurally valid JSON but semantically invalid for
 * extraction (e.g. duplicate field names, an `enum` without `values`, an `array`
 * without `items`). The domain is the source of truth, so the converter revalidates
 * rather than trusting the HTTP edge. Carries every issue found, not just the first.
 */
export class TemplateInvalid extends Error {
  constructor(public readonly issues: string[]) {
    super(
      `Invalid template:\n${issues.map((issue) => `  - ${issue}`).join("\n")}`,
    );
    this.name = "TemplateInvalid";
  }
}
