export class TemplateNotFound extends Error {
  constructor(public readonly templateId: string) {
    super(`Template ${templateId} not found`);
    this.name = "TemplateNotFound";
  }
}
