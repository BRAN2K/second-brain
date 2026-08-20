import { uuidv7 } from "uuidv7";
import { AggregateRoot } from "@/domain/core/aggregate-root";
import type { EntityProps } from "@/domain/core/entity";
import { Guard } from "@/domain/core/guard";
import { Issues } from "@/domain/core/issues";
import { EXTRACTION_BRN } from "@/domain/extraction/brn";
import type { ExtractionSourceType } from "@/domain/extraction/enums/extraction-source-type";
import type { ExtractionMeta } from "@/domain/extraction/value-objects/extraction-meta";
import type { ExtractionMissingField } from "@/domain/extraction/value-objects/extraction-missing-field";
import type { TemplateSnapshot } from "@/domain/extraction/value-objects/template-snapshot";
import { UnprocessableEntityError } from "@/libs/errors";

interface ExtractionProps extends EntityProps {
  templateId: string;
  createdAt: Date;
  sourceType: ExtractionSourceType;
  inputText: string;
  template: TemplateSnapshot;
  result: unknown | null;
  missingFields: ExtractionMissingField[];
  provider: string;
  model: string;
  meta: ExtractionMeta;
}

export interface CreateExtractionProps {
  templateId: string;
  sourceType: ExtractionSourceType;
  inputText: string;
  template: TemplateSnapshot;
  result: unknown;
  missingFields: ExtractionMissingField[];
  provider: string;
  model: string;
  meta: ExtractionMeta;
}

export class Extraction extends AggregateRoot {
  readonly templateId: string;
  readonly createdAt: Date;
  readonly sourceType: ExtractionSourceType;
  readonly inputText: string;
  readonly template: TemplateSnapshot;
  readonly result: unknown | null;
  readonly missingFields: ExtractionMissingField[];
  readonly provider: string;
  readonly model: string;
  readonly meta: ExtractionMeta;

  private constructor(props: ExtractionProps) {
    super(props);
    this.templateId = props.templateId;
    this.createdAt = new Date(props.createdAt);
    this.sourceType = props.sourceType;
    this.inputText = props.inputText;
    this.template = props.template;
    this.result = props.result;
    this.missingFields = props.missingFields;
    this.provider = props.provider;
    this.model = props.model;
    this.meta = props.meta;
  }

  static create(input: CreateExtractionProps): Extraction {
    const issues = new Issues();

    issues.add(Guard.againstEmptyString(input.templateId, "templateId"));
    issues.add(Guard.againstEmptyString(input.inputText, "inputText"));
    issues.add(Guard.againstEmptyString(input.provider, "provider"));
    issues.add(Guard.againstEmptyString(input.model, "model"));

    const itemNames = input.template.items.map((item) => item.name);
    for (const missing of input.missingFields) {
      issues.add(Guard.againstValueNotInList(missing.field, itemNames, "missingFields"));
    }

    if (issues.hasAny) {
      throw new UnprocessableEntityError(issues.all, { resource: EXTRACTION_BRN.resource });
    }

    return new Extraction({
      id: uuidv7(),
      templateId: input.templateId,
      createdAt: new Date(),
      sourceType: input.sourceType,
      inputText: input.inputText,
      template: input.template,
      result: input.result ?? null,
      missingFields: input.missingFields,
      provider: input.provider,
      model: input.model,
      meta: input.meta,
    });
  }

  static reconstitute(props: ExtractionProps): Extraction {
    return new Extraction(props);
  }

  get complete(): boolean {
    return this.missingFields.length === 0;
  }
}
