export class Issues {
  private readonly issues: string[] = [];

  add(issue: string | null): this {
    if (issue !== null) {
      this.issues.push(issue);
    }
    return this;
  }

  get hasAny(): boolean {
    return this.issues.length > 0;
  }

  get all(): string[] {
    return [...this.issues];
  }
}
