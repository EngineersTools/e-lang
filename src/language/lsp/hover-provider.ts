import { AstNode } from "langium";
import { AstNodeHoverProvider } from "langium/lsp";
import { Hover } from "vscode-languageserver";
import {
  isConstantDeclaration,
  isModelDeclaration,
  isMutableDeclaration,
  isPropertyDeclaration,
  isTypeReference,
  isUnitDeclaration,
  isUnitFamilyDeclaration,
} from "../generated/ast.js";
import {
  getTypeName,
  isErrorType,
  isListType,
  isModelType,
  isUnionType,
} from "../type-system/descriptions.js";
import { inferType } from "../type-system/infer.js";
import { TypeEnvironment } from "../type-system/TypeEnvironment.js";

export class ELangHoverProvider extends AstNodeHoverProvider {
  protected override getAstNodeHoverContent(node: AstNode): Hover | undefined {
    const typeEnv = new TypeEnvironment();
    const type = inferType(node, typeEnv);
    let hoverText = "";

    if (isErrorType(type)) {
      hoverText = `Error: ${type.message}`;
    } else if (isConstantDeclaration(node)) {
      hoverText = `(Constant) ${node.name}: ${getTypeName(type)}`;
    } else if (isMutableDeclaration(node)) {
      hoverText = `(Variable) ${node.name}: ${getTypeName(type)}`;
    } else if (isUnitDeclaration(node)) {
      hoverText = `(Unit) [${node.name}]: ${node.longName ?? ""}\n ${
        node.description ?? ""
      }`;
    } else if (isUnitFamilyDeclaration(node)) {
      hoverText = `(Unit Family) ${node.name}\n${node.description ?? ""}`;
    } else if (isModelDeclaration(node)) {
      hoverText = `(Model) ${node.name} { ${node.properties.map(
        (p) => `\n\t${p.name}: ${p.type.$type}`
      )} \n}`;
    } else if (isPropertyDeclaration(node)) {
      if (isModelType(type)) {
        hoverText = `(Model Property) ${node.name}: model ${type.modelName}`;
      } else if (isUnionType(type)) {
        hoverText = `(Model Property) ${node.name}: ${type.types
          .map((t) => t.$type)
          .join(" or ")}`;
      } else if (isListType(type)) {
        hoverText = `(Model Property) ${node.name}: ${type.itemType.$type} list`;
      } else if (isTypeReference(type.$type)) {
        hoverText = `(Model Property) ${node.name}: ${type.$type.$type}`;
      } else {
        hoverText = `(Model Property) ${node.name}: ${type.$type}`;
      }
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
