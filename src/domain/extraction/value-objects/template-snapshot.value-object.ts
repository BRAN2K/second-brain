import type { Template } from "../../template/entities/template.aggregate";
import type { TemplateItem } from "../../template/value-objects/template-item.value-object";
import { UnprocessableEntityError } from "@/libs/errors";
import { Guard } from "../../_core/guard";
import { Issues } from "../../_core/issues";
import { ValueObject } from "../../_core/value-object";
import { EXTRACTION_BRN } from "../brn";

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
