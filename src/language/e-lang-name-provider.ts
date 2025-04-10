import { AstNode, DefaultNameProvider } from "langium";
import {
  isConversionDeclaration,
  isLambdaDeclaration,
  isMeasurementType,
  isModelDeclaration,
  isModelMemberCall,
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
      if (isModelDeclaration(node.model)) {
        name = this.getName(node.model);
      } else if (isMeasurementType(node)) {
        name = `number_[${node.unitFamily.$refText}]`;
      } else {
        name = node.primitive;
      }

      if (node.array) name += "[]";
    } else if (isMeasurementType(node)) {
      name = `number_[${node.unitFamily.$refText}]`;
    } else if (isModelMemberCall(node)) {
      name = node.element.$refText;
    } else if (isLambdaDeclaration(node)) {
      const returnTypeName = node.returnType
        ? this.getName(node.returnType)
        : "null";
      name = `() => ${returnTypeName}`;
    } else {
      name = super.getName(node);
    }

    return name;
  }
}
