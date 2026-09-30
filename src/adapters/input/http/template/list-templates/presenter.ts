import type { TemplatesPage } from "@/domain/template/repositories/template.repository";
import type { ListTemplatesResponse } from "./response";
import { TemplatePresenter } from "../_shared/template.presenter";

export const ListTemplatesPresenter = {
  toHttp(page: TemplatesPage): ListTemplatesResponse {
    return {
      items: page.templates.map((template) => TemplatePresenter.toHttp(template)),
      nextCursor: page.hasNext ? page.templates[page.templates.length - 1].id : null,
    };
  },
};
