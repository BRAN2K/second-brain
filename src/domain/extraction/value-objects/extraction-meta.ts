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

export class ExtractionMeta extends ValueObject {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly transcriptionDurationMs: number;

  private constructor(props: ExtractionMetaProps) {
    super();
    this.inputTokens = props.inputTokens;
    this.outputTokens = props.outputTokens;
    this.transcriptionDurationMs = props.transcriptionDurationMs;
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
}
