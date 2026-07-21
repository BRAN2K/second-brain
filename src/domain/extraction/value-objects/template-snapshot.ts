import { EXTRACTION_BRN } from "@/domain/extraction/brn";
import { Guard } from "@/domain/shared/guard";
import { Issues } from "@/domain/shared/issues";
import { ValueObject } from "@/domain/shared/value-object";
import type { Template } from "@/domain/template/entities/template";
import type { TemplateItem } from "@/domain/template/value-objects/template-item";
import { UnprocessableEntityError } from "@/infrastructure/helpers/errors";

export interface TemplateSnapshotProps {
  id: string;
  name: string;
  description: string;
  items: TemplateItem[];
  rules: string[];
}

export class TemplateSnapshot extends ValueObject<TemplateSnapshotProps> {
  private constructor(props: TemplateSnapshotProps) {
    super(props);
  }

  static create(props: TemplateSnapshotProps): TemplateSnapshot {
    const issues = new Issues();

    issues.add(Guard.againstEmptyString(props.id, "id"));
    issues.add(Guard.againstEmptyString(props.name, "name"));
    issues.add(Guard.againstEmptyArray(props.items, "items"));

    if (issues.hasAny) {
      throw new UnprocessableEntityError(issues.all, {
        resource: EXTRACTION_BRN.resource,
        scope: EXTRACTION_BRN.scope.templateSnapshot,
      });
    }

    return new TemplateSnapshot(props);
  }

  static reconstitute(props: TemplateSnapshotProps): TemplateSnapshot {
    return new TemplateSnapshot(props);
  }

  static fromTemplate(template: Template): TemplateSnapshot {
    return new TemplateSnapshot({
      id: template.id,
      name: template.name,
      description: template.description,
      items: template.items,
      rules: template.rules,
    });
  }

  get id(): string {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string {
    return this.props.description;
  }
  get items(): TemplateItem[] {
    return [...this.props.items];
  }
  get rules(): string[] {
    return [...this.props.rules];
  }

  toJSON(): TemplateSnapshotProps {
    return { ...this.props };
  }
}
