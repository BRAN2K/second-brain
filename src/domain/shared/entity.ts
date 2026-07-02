export abstract class Entity<TId> {
  readonly id: TId;

  protected constructor(id: TId) {
    this.id = id;
  }

  equals(other: Entity<TId>): boolean {
    return this.id === other.id;
  }
}
