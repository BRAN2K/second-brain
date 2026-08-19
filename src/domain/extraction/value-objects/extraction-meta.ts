import { EXTRACTION_BRN } from "@/domain/extraction/brn";
import { Guard } from "@/domain/shared/guard";
import { Issues } from "@/domain/shared/issues";
import { ValueObject } from "@/domain/shared/value-object";
import { UnprocessableEntityError } from "@/libs/errors";

export interface ExtractionMetaProps {
  inputTokens: number;
  outputTokens: number;
  transcriptionDurationMs: number;
}

export class ExtractionMeta extends ValueObject<ExtractionMetaProps> {
  private constructor(props: ExtractionMetaProps) {
    super(props);
  }

  static create(props: ExtractionMetaProps): ExtractionMeta {
    const issues = new Issues();

    issues.add(Guard.againstWrongType(props.inputTokens, "number", "inputTokens"));
    issues.add(Guard.againstWrongType(props.outputTokens, "number", "outputTokens"));
    issues.add(
      Guard.againstWrongType(props.transcriptionDurationMs, "number", "transcriptionDurationMs"),
    );

    if (issues.hasAny) {
      throw new UnprocessableEntityError(issues.all, {
        resource: EXTRACTION_BRN.resource,
        scope: EXTRACTION_BRN.scope.meta,
      });
    }

    return new ExtractionMeta(props);
  }

  static reconstitute(props: ExtractionMetaProps): ExtractionMeta {
    return new ExtractionMeta(props);
  }

  get inputTokens(): number {
    return this.props.inputTokens;
  }
  get outputTokens(): number {
    return this.props.outputTokens;
  }
  get transcriptionDurationMs(): number {
    return this.props.transcriptionDurationMs;
  }

  toJSON(): ExtractionMetaProps {
    return { ...this.props };
  }
}
