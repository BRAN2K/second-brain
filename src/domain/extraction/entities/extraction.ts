import { uuidv7 } from "uuidv7";
import type { ExtractionSourceType } from "@/domain/extraction/enums/extraction-source-type";
import type { Template } from "@/domain/extraction/value-objects/template";
import { AggregateRoot } from "@/domain/shared/aggregate-root";

interface ExtractionProps {
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  sourceType: ExtractionSourceType;
  inputText: string;
  template: unknown;
  result: unknown | null;
  missingFields: string[];
  complete: boolean;
  provider: string;
  model: string;
  meta: Record<string, unknown>;
}

export interface CreateExtractionProps {
  sourceType: ExtractionSourceType;
  inputText: string;
  template: Template;
  result: unknown;
  provider: string;
  model: string;
  meta: Record<string, unknown>;
}

export interface ReconstituteExtractionProps extends ExtractionProps {
  id: string;
}

export class Extraction extends AggregateRoot<string> {
  private readonly props: ExtractionProps;

  private constructor(id: string, props: ExtractionProps) {
    super(id);
    this.props = props;
  }

  static create(input: CreateExtractionProps): Extraction {
    const now = new Date();
    const missingFields: string[] = [];

    return new Extraction(uuidv7(), {
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      sourceType: input.sourceType,
      inputText: input.inputText,
      template: input.template,
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
  get provider(): string {
    return this.props.provider;
  }
  get model(): string {
    return this.props.model;
  }
  get meta(): Record<string, unknown> {
    return this.props.meta;
  }
}
