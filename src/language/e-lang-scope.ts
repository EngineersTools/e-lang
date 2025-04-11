import {
  DefaultScopeProvider,
  LangiumDocuments
} from "langium";
import { LangiumServices } from "langium/lsp";

export class ELangScopeProvider extends DefaultScopeProvider {
  protected readonly langiumDocuments: LangiumDocuments;

  constructor(services: LangiumServices) {
    super(services);
    this.langiumDocuments = services.shared.workspace.LangiumDocuments;
  }
}
