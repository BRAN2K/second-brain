export interface EntityProps {
  id: string;
}

export abstract class Entity {
  readonly id: string;

  protected constructor(props: EntityProps) {
    this.id = props.id;
  }

  equals(other: Entity): boolean {
    return this.id === other.id;
  }
}
