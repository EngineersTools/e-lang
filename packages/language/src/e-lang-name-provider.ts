import { AstNode, DefaultNameProvider } from "langium";
import { isParameterDeclaration } from "./generated/ast.js";

export class ELangNameProvider extends DefaultNameProvider {
  constructor() {
    super();
  }

  override getName(node: AstNode): string | undefined {
    let name: string | undefined;

    if (isParameterDeclaration(node)) {
      name = node.name;
    } else {
      name = super.getName(node);
    }

    return name;
  }
}