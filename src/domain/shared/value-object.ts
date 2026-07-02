import { isDeepStrictEqual } from "node:util";

export abstract class ValueObject<T extends object> {
  protected readonly props: T;

  constructor(props: T) {
    this.props = Object.freeze(props);
  }

  equals(other: ValueObject<T>): boolean {
    if (other === this) {
      return true;
    }

    if (other.constructor !== this.constructor) {
      return false;
    }

    return isDeepStrictEqual(this.props, other.props);
  }
}
