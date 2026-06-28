/**
 * Base Entity: has a stable identity (`id`) and is compared by that identity, never by
 * its attributes. Two entities are equal when they are the same type and share the same
 * id — their other fields may differ across time. Attributes can change; identity cannot.
 * Ids are compared by value (`===`), which fits primitive/branded-string ids.
 */
export abstract class Entity<TId> {
  readonly id: TId;

  protected constructor(id: TId) {
    this.id = id;
  }

  equals(other?: Entity<TId>): boolean {
    if (other === undefined || other === null) {
      return false;
    }
    if (other === this) {
      return true;
    }
    if (other.constructor !== this.constructor) {
      return false;
    }
    return this.id === other.id;
  }
}
