import { ValidationProblemAcceptor, TypirServices } from "typir";
import { ConstantDeclaration, MutableDeclaration } from "../../generated/ast.js";
import { ELangSpecifics } from "../ELangSpecifics.interface.js";


export function validateVariableDeclaration(
  node: ConstantDeclaration | MutableDeclaration,
  accept: ValidationProblemAcceptor<ELangSpecifics>,
  typir: TypirServices<ELangSpecifics>
): void {
  if (node.assignment) {
    typir.validation.Constraints.ensureNodeIsAssignable(
      node.value,
      node,
      accept,
      (actual, expected) => ({
        message: `The expression '${node.value?.$cstNode?.text}' of type '${actual.name}' is not assignable to '${node.name}' with type '${expected.name}'`,
        languageProperty: "value",
      })
    );
  }
}

