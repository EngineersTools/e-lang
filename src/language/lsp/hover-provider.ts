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
  isListType,
  isModelType,
  isUnionType,
} from "../type-system/descriptions.js";
import { inferType } from "../type-system/infer.js";
import { TypeEnvironment } from "../type-system/TypeEnvironment.js";

export class ELangHoverProvider extends AstNodeHoverProvider {
  protected getAstNodeHoverContent(node: AstNode): Hover | undefined {
    if (isConstantDeclaration(node)) {
      const type = inferType(node.type, new TypeEnvironment());
      let hoverText = "";

      if (isModelType(type)) {
        hoverText = `(Constant) ${node.name}: model ${type.modelName}`;
      } else if (isUnionType(type)) {
        hoverText = `(Constant) ${node.name}: ${type.types
          .map((t) => t.$type)
          .join(" or ")}`;
      } else if (isListType(type)) {
        hoverText = `(Constant) ${node.name}: ${type.itemType.$type} list`;
      } else if (isTypeReference(type.$type)) {
        hoverText = `(Constant) ${node.name}: ${type.$type.$type}`;
      } else {
        hoverText = `(Constant) ${node.name}: ${type.$type}`;
      }

      return {
        contents: {
          kind: "markdown",
          language: "e-lang",
          value: hoverText,
        },
      };
    } else if (isMutableDeclaration(node)) {
      const type = inferType(node.type, new TypeEnvironment());
      let hoverText = "";

      if (isModelType(type)) {
        hoverText = `(Variable) ${node.name}: model ${type.modelName}`;
      } else if (isUnionType(type)) {
        hoverText = `(Variable) ${node.name}: ${type.types
          .map((t) => t.$type)
          .join(" or ")}`;
      } else if (isListType(type)) {
        hoverText = `(Variable) ${node.name}: ${type.itemType.$type} list`;
      } else if (isTypeReference(type.$type)) {
        hoverText = `(Variable) ${node.name}: ${type.$type.$type}`;
      } else {
        hoverText = `(Variable) ${node.name}: ${type.$type}`;
      }

      return {
        contents: {
          kind: "markdown",
          language: "e-lang",
          value: hoverText,
        },
      };
    } else if (isUnitDeclaration(node)) {
      return {
        contents: {
          kind: "markdown",
          language: "e-lang",
          value: `(Unit) [${node.name}]: ${node.longName ?? ""}\n ${
            node.description ?? ""
          }`,
        },
      };
    } else if (isUnitFamilyDeclaration(node)) {
      return {
        contents: {
          kind: "markdown",
          language: "e-lang",
          value: `(Unit Family) ${node.name} \n ${node.description ?? ""}`,
        },
      };
    } else if (isModelDeclaration(node)) {
      return {
        contents: {
          kind: "markdown",
          language: "e-lang",
          value: `(Model) ${node.name} { ${node.properties.map(
            (p) => `\n\t${p.name}: ${p.type.$type}`
          )} \n}`,
        },
      };
    } else if (isPropertyDeclaration(node)) {
      const type = inferType(node.type, new TypeEnvironment());
      let hoverText = "";

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

      return {
        contents: {
          kind: "markdown",
          language: "e-lang",
          value: hoverText,
        },
      };
    }

    return undefined;
  }
}
