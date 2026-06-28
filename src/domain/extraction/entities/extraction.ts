import type { ExtractionSourceType } from "@/domain/extraction/enums/extraction-source-type";
import type { Template } from "@/domain/extraction/value-objects/template";
import { AggregateRoot } from "@/domain/shared/aggregate-root";
import { generateUuidV7, type UuidV7 } from "@/domain/shared/types/uuid-v7";

interface ExtractionProps {
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  sourceType: ExtractionSourceType;
  /** Original text, or the transcription when the source is audio. */
  inputText: string;
  /** Plain snapshot of the template used for this extraction. */
  template: unknown;
  result: unknown | null;
  missingFields: string[];
  complete: boolean;
  provider: string | null;
  model: string | null;
  meta: Record<string, unknown>;
}

/** Input to `Extraction.create` — identity and timestamps are minted by the aggregate. */
export interface CreateExtractionProps {
  sourceType: ExtractionSourceType;
  inputText: string;
  template: Template;
  result: unknown;
  provider: string;
  model: string;
  meta: Record<string, unknown>;
}

/** Input to `Extraction.reconstitute` — the full state loaded from persistence. */
export interface ReconstituteExtractionProps extends ExtractionProps {
  id: UuidV7;
}

/**
 * The extraction aggregate root: one extraction request and its outcome. It owns its
 * identity (UUID v7 minted in `create`) and the completeness invariant — `missingFields`
 * and `complete` are derived from the template, never set from outside. `create` mints a
 * new aggregate; `reconstitute` rebuilds one from a stored row.
 */
export class Extraction extends AggregateRoot<UuidV7> {
  private readonly props: ExtractionProps;

  private constructor(id: UuidV7, props: ExtractionProps) {
    super(id);
    this.props = props;
  }

  static create(input: CreateExtractionProps): Extraction {
    const now = new Date();
    const missingFields = input.template.findMissingFields(input.result);
    return new Extraction(generateUuidV7(), {
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      sourceType: input.sourceType,
      inputText: input.inputText,
      template: input.template.toJSON(),
      result: input.result ?? null,
      missingFields,
      complete: missingFields.length === 0,
      provider: input.provider,
      model: input.model,
      meta: input.meta,
    });
  }

  static reconstitute(input: ReconstituteExtractionProps): Extraction {
    const { id, ...props } = input;
    return new Extraction(id, props);
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }
  get sourceType(): ExtractionSourceType {
    return this.props.sourceType;
  }
  get inputText(): string {
    return this.props.inputText;
  }
  get template(): unknown {
    return this.props.template;
  }
  get result(): unknown | null {
    return this.props.result;
  }
  get missingFields(): string[] {
    return this.props.missingFields;
  }
  get complete(): boolean {
    return this.props.complete;
  }
  get provider(): string | null {
    return this.props.provider;
  }
  get model(): string | null {
    return this.props.model;
  }
  get meta(): Record<string, unknown> {
    return this.props.meta;
  }
}
