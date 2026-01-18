import {
  DefaultScopeComputation
} from "langium";
import { ELangServices } from "./ELangServices.type.js";

export class ELangScopeComputation extends DefaultScopeComputation {
  constructor(services: ELangServices) {
    super(services);
  }

  // protected override addLocalSymbol(
  //   node: AstNode,
  //   document: LangiumDocument,
  //   symbols: MultiMap<AstNode, AstNodeDescription>
  // ): void {
  //   if (isUnitDeclaration(node)) {
  //     const root = document.parseResult.value;
  //     symbols.add(
  //       root,
  //       this.descriptions.createDescription(node, node.name, document)
  //     );
  //   } else {
  //     super.addLocalSymbol(node, document, symbols);
  //   }
  // }
}
