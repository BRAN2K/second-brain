import { EXTRACTION_BRN } from "@/domain/extraction/brn";
import { Guard } from "@/domain/shared/guard";
import { Issues } from "@/domain/shared/issues";
import { ValueObject } from "@/domain/shared/value-object";
import { UnprocessableEntityError } from "@/libs/errors";

export interface ExtractionMissingFieldProps {
  field: string;
  usedDefault: boolean;
}

export class ExtractionMissingField extends ValueObject {
  readonly field: string;
  readonly usedDefault: boolean;

  private constructor(props: ExtractionMissingFieldProps) {
    super();
    this.field = props.field;
    this.usedDefault = props.usedDefault;
  }

  static create(props: ExtractionMissingFieldProps): ExtractionMissingField {
    const issues = new Issues();

    issues.add(Guard.againstEmptyString(props.field, "field"));

    if (issues.hasAny) {
      throw new UnprocessableEntityError(issues.all, {
        resource: EXTRACTION_BRN.resource,
        scope: EXTRACTION_BRN.scope.missingField,
      });
    }

    return new ExtractionMissingField(props);
  }

  static reconstitute(props: ExtractionMissingFieldProps): ExtractionMissingField {
    return new ExtractionMissingField(props);
  }
}
