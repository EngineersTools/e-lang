import {
    DefaultScopeProvider,
    LangiumDocuments,
} from "langium";
import { TypirLangiumServices } from "typir-langium";
import { ELangServices } from "./ELangServices.type.js";
import { ELangSpecifics } from "./type-system/ELangSpecifics.interface.js";

export class ELangScopeProvider extends DefaultScopeProvider {
  protected readonly langiumDocuments: LangiumDocuments;
  protected readonly typir: TypirLangiumServices<ELangSpecifics>;

  constructor(services: ELangServices) {
    super(services);
    this.langiumDocuments = services.shared.workspace.LangiumDocuments;
    this.typir = services.typir;
  }
}


