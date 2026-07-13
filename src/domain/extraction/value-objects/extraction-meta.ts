import { InvalidExtractionMeta } from "@/domain/extraction/errors/invalid-extraction-meta";
import { Guard } from "@/domain/shared/guard";
import { Issues } from "@/domain/shared/issues";
import { ValueObject } from "@/domain/shared/value-object";

export interface ExtractionMetaProps {
  tokensUsed: number;
  processingTime: number;
}

export class ExtractionMeta extends ValueObject<ExtractionMetaProps> {
  private constructor(props: ExtractionMetaProps) {
    super(props);
  }

  static create(props: ExtractionMetaProps): ExtractionMeta {
    const issues = new Issues();

    issues.add(Guard.againstWrongType(props.tokensUsed, "number", "tokensUsed"));
    issues.add(Guard.againstWrongType(props.processingTime, "number", "processingTime"));

    if (issues.hasAny) {
      throw new InvalidExtractionMeta(issues.all);
    }

    return new ExtractionMeta(props);
  }

  static reconstitute(props: ExtractionMetaProps): ExtractionMeta {
    return new ExtractionMeta(props);
  }

  get tokensUsed(): number {
    return this.props.tokensUsed;
  }
  get processingTime(): number {
    return this.props.processingTime;
  }

  toJSON(): ExtractionMetaProps {
    return { ...this.props };
  }
}
