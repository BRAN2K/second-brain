import { Entity } from "@/domain/shared/entity";

export abstract class AggregateRoot<TId> extends Entity<TId> {}
