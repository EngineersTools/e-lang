import { AstNode, isNamed } from "langium";
import { AstNodeHoverProvider } from "langium/lsp";
import { isType } from "typir";
import { TypirLangiumServices } from "typir-langium";
import { ELangServices } from "./ELangServices.type.js";
import { ELangSpecifics } from "./type-system/ELangSpecifics.interface.js";

export class ELangHoverProvider extends AstNodeHoverProvider {
  private typir: TypirLangiumServices<ELangSpecifics>;

  constructor(services: ELangServices) {
    super(services);
    this.typir = services.typir;
  }

  protected override getAstNodeHoverContent(node: AstNode): string | undefined {
    let hoverText = "";
    const nodeType = this.typir.Inference.inferType(node);

    const typeName = isType(nodeType)
      ? nodeType.getUserRepresentation()
      : nodeType.map((inferenceProblem) => inferenceProblem.languageNode.$type);

    if (isNamed(node)) {
      hoverText += `${node.name}: ${typeName}`;
    }

    return hoverText;
  }
}
