import { DefaultLinker } from "langium";
import { LangiumServices } from "langium/lsp";

export class ElangLinker extends DefaultLinker {
  constructor(services: LangiumServices) {
    super(services);
  }
}
