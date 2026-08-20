import type { Template } from "@/domain/template/entities/template.aggregate";
import type { TemplateItem } from "@/domain/template/value-objects/template-item.value-object";
import { Guard } from "@/domain/core/guard";
import { Issues } from "@/domain/core/issues";
import { ValueObject } from "@/domain/core/value-object";
import { EXTRACTION_BRN } from "@/domain/extraction/brn";
import { UnprocessableEntityError } from "@/libs/errors";

export interface TemplateSnapshotProps {
  id: string;
  name: string;
  description: string;
  items: TemplateItem[];
  rules: string[];
}

export class TemplateSnapshot extends ValueObject {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly items: TemplateItem[];
  readonly rules: string[];

  private constructor(props: TemplateSnapshotProps) {
    super();
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.items = props.items;
    this.rules = props.rules;
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
      items: [...template.items],
      rules: [...template.rules],
    });
  }
}
