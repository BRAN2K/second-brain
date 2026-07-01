import { ValueObject } from "@/domain/shared/value-object";

enum ItemAcceptedTypes {
  number = "number",
  string = "string",
  boolean = "boolean",
  date = "date",
  enum = "enum",
}

interface ItemType {
  type: ItemAcceptedTypes;
  default?: ItemAcceptedTypes;
  rules?: string[];
  values?: string[]; //obrigatorio quando o type for enum
}

interface TemplateItem {
  name: string;
  type: ItemType;
  required: boolean;
  rules?: string[]; // regra para o campo
  description?: string;
}

interface TemplateProps {
  name: string;
  description?: string;
  items: TemplateItem[];
  rules?: string[]; // regra para o template
}

export class Template extends ValueObject<TemplateProps> {
  private constructor(props: TemplateProps) {
    super(props);
  }

  //TODO: implementar outros metodos
}
