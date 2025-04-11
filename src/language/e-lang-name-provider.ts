import { AstNode, DefaultNameProvider } from "langium";
import {
  isConversionDeclaration,
  isDimensionDeclaration,
  isModelDeclaration,
  isParameterDeclaration,
  isTypeReference,
} from "./generated/ast.js";

export class ELangNameProvider extends DefaultNameProvider {
  override getName(node: AstNode): string | undefined {
    let name: string | undefined;

    if (isConversionDeclaration(node)) {
      name = `${node.from.$refText}->${node.to.$refText}`;
    } else if (isParameterDeclaration(node)) {
      name = node.name;
    } else if (isTypeReference(node)) {
      if (isModelDeclaration(node.declaredType)) {
        name = this.getName(node.declaredType);
      } else if (isDimensionDeclaration(node.declaredType)) {
        name = node.declaredType.$refText;
      } else {
        name = node.primitive;
      }

      if (node.array) name += "[]";
    } else if (isDimensionDeclaration(node)) {
      name = node.name;
    } else {
      name = super.getName(node);
    }

    return name;
  }
}
