import {
  AstNode,
  AstNodeDescription,
  DefaultScopeComputation,
  LangiumDocument,
  MultiMap,
} from "langium";
import { ELangServices } from "./ELangServices.type.js";

export class ELangScopeComputation extends DefaultScopeComputation {
  constructor(services: ELangServices) {
    super(services);
  }

  protected override addLocalSymbol(
    node: AstNode,
    document: LangiumDocument,
    symbols: MultiMap<AstNode, AstNodeDescription>
  ): void {
    console.log("Adding local symbol:", node);
    console.log("Document:", document);
    console.log("Symbols:", symbols);
    super.addLocalSymbol(node, document, symbols);
  }
}
