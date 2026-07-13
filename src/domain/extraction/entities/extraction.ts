import { uuidv7 } from "uuidv7";
import type { ExtractionSourceType } from "@/domain/extraction/enums/extraction-source-type";
import { ExtractionInvalid } from "@/domain/extraction/errors/extraction-invalid";
import type { ExtractionMeta } from "@/domain/extraction/value-objects/extraction-meta";
import type { ExtractionMissingField } from "@/domain/extraction/value-objects/extraction-missing-field";
import type { TemplateSnapshot } from "@/domain/extraction/value-objects/template-snapshot";
import { AggregateRoot } from "@/domain/shared/aggregate-root";
import { Guard } from "@/domain/shared/guard";
import { Issues } from "@/domain/shared/issues";

interface ExtractionProps {
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
    const issues = new Issues();

    issues.add(Guard.againstEmptyString(input.templateId, "templateId"));
    issues.add(Guard.againstEmptyString(input.inputText, "inputText"));
    issues.add(Guard.againstEmptyString(input.provider, "provider"));
    issues.add(Guard.againstEmptyString(input.model, "model"));

    // Missing fields must refer to fields the template actually declares.
    const itemNames = input.template.items.map((item) => item.name);
    for (const missing of input.missingFields) {
      issues.add(Guard.againstValueNotInList(missing.field, itemNames, "missingFields"));
    }

    if (issues.hasAny) {
      throw new ExtractionInvalid(issues.all);
    }

    return new Extraction(uuidv7(), {
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

  static reconstitute(input: ReconstituteExtractionProps): Extraction {
    const { id, ...props } = input;
    return new Extraction(id, props);
  }

  get templateId(): string {
    return this.props.templateId;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get sourceType(): ExtractionSourceType {
    return this.props.sourceType;
  }
  get inputText(): string {
    return this.props.inputText;
  }
  get template(): TemplateSnapshot {
    return this.props.template;
  }
  get result(): unknown | null {
    return this.props.result;
  }
  get missingFields(): ExtractionMissingField[] {
    return this.props.missingFields;
  }
  get complete(): boolean {
    return this.props.missingFields.length === 0;
  }
  get provider(): string {
    return this.props.provider;
  }
  get model(): string {
    return this.props.model;
  }
  get meta(): ExtractionMeta {
    return this.props.meta;
  }
}
