import {
    AstNode,
    AstNodeDescription,
    DefaultScopeComputation,
    LangiumDocument,
    MultiMap,
} from "langium";
import { ELangServices } from "./ELangServices.type.js";
import { isUnitDeclaration } from "./generated/ast.js";

export class ELangScopeComputation extends DefaultScopeComputation {
  constructor(services: ELangServices) {
    super(services);
  }

  protected override addLocalSymbol(
    node: AstNode,
    document: LangiumDocument,
    symbols: MultiMap<AstNode, AstNodeDescription>
  ): void {
    if (isUnitDeclaration(node)) {
      const container = node.$container.$container;
      if (container) {
        const name = this.nameProvider.getName(node);
        if (name) {
          symbols.add(
            container,
            this.descriptions.createDescription(node, name, document)
          );
        }
      }
    }

    super.addLocalSymbol(node, document, symbols);
  }
}
