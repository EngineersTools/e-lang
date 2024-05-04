import { DefaultCompletionProvider, LangiumServices } from "langium/lsp";

export class ElangCompletionProvider extends DefaultCompletionProvider {
  constructor(services: LangiumServices) {
    super(services);
  }
}
