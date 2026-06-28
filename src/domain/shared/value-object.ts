/**
 * Base Value Object: identity-free, compared by value, immutable. Subclasses pass
 * their props to the constructor; `props` is frozen so a VO can never mutate after
 * creation. Equality is structural (deep) over `props` — two VOs are equal when they
 * carry the same data, regardless of reference.
 */
export abstract class ValueObject<T extends object> {
  protected readonly props: T;

  constructor(props: T) {
    this.props = Object.freeze(props);
  }

  equals(other?: ValueObject<T>): boolean {
    if (other === undefined || other === null) {
      return false;
    }
    if (other === this) {
      return true;
    }
    if (other.constructor !== this.constructor) {
      return false;
    }
    return deepEqual(this.props, other.props);
  }
}

/** Structural equality for plain JSON-like values (the only thing VO props hold). */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }
  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a === null ||
    b === null
  ) {
    return false;
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      return false;
    }
    return a.every((item, i) => deepEqual(item, b[i]));
  }
  const aKeys = Object.keys(a as Record<string, unknown>);
  const bKeys = Object.keys(b as Record<string, unknown>);
  if (aKeys.length !== bKeys.length) {
    return false;
  }
  return aKeys.every((key) =>
    deepEqual(
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key],
    ),
  );
}
