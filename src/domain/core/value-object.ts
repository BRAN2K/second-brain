export abstract class ValueObject {
  equals(other: ValueObject): boolean {
    if (other === this) {
      return true;
    }

    if (other.constructor !== this.constructor) {
      return false;
    }

    return Bun.deepEquals(this, other, true);
  }
}
