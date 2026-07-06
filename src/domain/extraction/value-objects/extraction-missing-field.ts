import { InvalidExtractionMissingField } from "@/domain/extraction/errors/invalid-extraction-missing-field";
import { Guard } from "@/domain/shared/guard";
import { Issues } from "@/domain/shared/issues";
import { ValueObject } from "@/domain/shared/value-object";

export interface ExtractionMissingFieldProps {
  field: string;
  usedDefault: boolean;
}

export class ExtractionMissingField extends ValueObject<ExtractionMissingFieldProps> {
  private constructor(props: ExtractionMissingFieldProps) {
    super(props);
  }

  static create(props: ExtractionMissingFieldProps): ExtractionMissingField {
    const issues = new Issues();

    issues.add(Guard.againstEmptyString(props.field, "field"));

    if (issues.hasAny) {
      throw new InvalidExtractionMissingField(issues.all);
    }

    return new ExtractionMissingField(props);
  }

  static reconstitute(props: ExtractionMissingFieldProps): ExtractionMissingField {
    return new ExtractionMissingField(props);
  }

  get field(): string {
    return this.props.field;
  }
  get usedDefault(): boolean {
    return this.props.usedDefault;
  }

  toJSON(): ExtractionMissingFieldProps {
    return { ...this.props };
  }
}
