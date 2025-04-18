import { AstNode, isNamed } from "langium";
import { AstNodeHoverProvider } from "langium/lsp";
import { isType } from "typir";
import { TypirLangiumServices } from "typir-langium";
import { Hover } from "vscode-languageserver";
import { ELangServices } from "./e-lang-module.js";
import { ELangAstType } from "./generated/ast.js";

export class ELangHoverProvider extends AstNodeHoverProvider {
  private typir: TypirLangiumServices<ELangAstType>;

  constructor(services: ELangServices) {
    super(services);
    this.typir = services.typir;
  }

  protected override getAstNodeHoverContent(node: AstNode): Hover | undefined {
    console.log("getAstNodeHoverContext")
    let hoverText = "";
    const nodeType = this.typir.Inference.inferType(node);
    const typeName = isType(nodeType)
      ? nodeType.getIdentifier()
      : nodeType.map((inferenceProblem) => inferenceProblem.languageNode.$type);

    if (isNamed(node)) {
      hoverText += `${node.name}: ${typeName}`;
    }

    return {
      contents: {
        kind: "markdown",
        language: "e-lang",
        value: hoverText,
      },
    };
  }
}
