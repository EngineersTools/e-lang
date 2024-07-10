import { AstNode } from "langium";
import { AstNodeHoverProvider } from "langium/lsp";
import { Hover } from "vscode-languageserver";
import {
  isConstantDeclaration,
  isModelDeclaration,
  isMutableDeclaration,
  isPropertyDeclaration,
  isUnitDeclaration,
  isUnitFamilyDeclaration,
} from "../generated/ast.js";

export class ElangHoverProvider extends AstNodeHoverProvider {
  protected getAstNodeHoverContent(node: AstNode): Hover | undefined {
    if (isConstantDeclaration(node)) {
      return {
        contents: {
          kind: "markdown",
          language: "elang",
          value: `(Constant) ${node.name}`,
        },
      };
    } else if (isMutableDeclaration(node)) {
      return {
        contents: {
          kind: "markdown",
          language: "elang",
          value: `(Variable) ${node.name}`,
        },
      };
    } else if (isUnitDeclaration(node)) {
      return {
        contents: {
          kind: "markdown",
          language: "elang",
          value: `(Unit) [${node.name}]: ${node.longName ?? ""}\n ${
            node.description ?? ""
          }`,
        },
      };
    } else if (isUnitFamilyDeclaration(node)) {
      return {
        contents: {
          kind: "markdown",
          language: "elang",
          value: `(Unit Family) ${node.name} \n ${node.description ?? ""}`,
        },
      };
    } else if (isModelDeclaration(node)) {
      return {
        contents: {
          kind: "markdown",
          language: "elang",
          value: `(Model) ${node.name} { ${node.properties.map(
            (p) => `\n\t${p.name}: ${p.type.$type}`
          )} \n}`,
        },
      };
    } else if (isPropertyDeclaration(node)) {
      return {
        contents: {
          kind: "markdown",
          language: "elang",
          value: `(Model Property) ${node.name}: ${node.type.$type}`,
        },
      };
    }

    return undefined;
  }
}
