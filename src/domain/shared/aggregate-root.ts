import { Entity } from "@/domain/shared/entity";

/**
 * Base Aggregate Root: the single entry point and consistency boundary of an aggregate.
 * Outside code references the aggregate only through its root; invariants spanning the
 * aggregate are enforced here. No domain events yet (nothing consumes them) — this is a
 * semantic marker over `Entity` until they're needed.
 */
export abstract class AggregateRoot<TId> extends Entity<TId> {}
