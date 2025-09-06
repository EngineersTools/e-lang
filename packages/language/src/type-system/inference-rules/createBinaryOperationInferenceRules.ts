import { diagnosticData } from "langium";
import { InferOperatorWithMultipleOperands } from "typir";
import {
  BinaryExpression,
  isConstantDeclaration,
  isReferenceExpression,
} from "../../generated/ast.js";
import { ElangTypirServices } from "../ELangAdditionalTypirServices.type.js";
import { ELangSpecifics } from "../ELangSpecifics.interface.js";
import {
  createTypeAny,
  getOrCreateTypeBool,
  getOrCreateTypeNumber,
  getOrCreateTypeText,
} from "../typir-types/createPrimitives.js";

export function createBinaryOperationInferenceRules(typir: ElangTypirServices) {
  const typeAny = createTypeAny(typir);
  const typeNumber = getOrCreateTypeNumber(typir);
  const typeText = getOrCreateTypeText(typir);
  const typeBoolean = getOrCreateTypeBool(typir);

  const binaryInferenceRule: InferOperatorWithMultipleOperands<
    ELangSpecifics,
    BinaryExpression
  > = {
    languageKey: BinaryExpression.$type,
    matching: (node: BinaryExpression, name: string) => node.operator === name,
    operands: (node: BinaryExpression, _name: string) => [
      node.left,
      node.right,
    ],
    validateArgumentsOfCalls: true,
  };

  for (const operator of ["-", "*", "/"]) {
    typir.factory.Operators.createBinary({
      name: operator,
      signature: { left: typeNumber, right: typeNumber, return: typeNumber },
    })
      .inferenceRule(binaryInferenceRule)
      .finish();
  }

  typir.factory.Operators.createBinary({
    name: "+",
    signatures: [
      { left: typeNumber, right: typeNumber, return: typeNumber },
      { left: typeText, right: typeText, return: typeText },
      { left: typeNumber, right: typeText, return: typeText },
      { left: typeText, right: typeNumber, return: typeText },
    ],
  })
    .inferenceRule(binaryInferenceRule)
    .finish();

  for (const operator of ["<", "<=", ">", ">="]) {
    typir.factory.Operators.createBinary({
      name: operator,
      signature: { left: typeNumber, right: typeNumber, return: typeBoolean },
    })
      .inferenceRule(binaryInferenceRule)
      .finish();
  }

  for (const operator of ["and", "or"]) {
    typir.factory.Operators.createBinary({
      name: operator,
      signature: { left: typeBoolean, right: typeBoolean, return: typeBoolean },
    })
      .inferenceRule(binaryInferenceRule)
      .finish();
  }

  for (const operator of ["equal", "not_equal"]) {
    typir.factory.Operators.createBinary({
      name: operator,
      signature: { left: typeAny, right: typeAny, return: typeBoolean },
    })
      .inferenceRule({
        ...binaryInferenceRule,
        validation: (node, _operatorName, _operatorType, accept, typir) =>
          typir.validation.Constraints.ensureNodeIsEquals(
            node.left,
            node.right,
            accept,
            (actual, expected) => ({
              message: `This comparison will always return '${
                node.operator === "equal" ? "false" : "true"
              }' as '${node.left.$cstNode?.text}' and '${
                node.right.$cstNode?.text
              }' have the different types '${actual.name}' and '${
                expected.name
              }'.`,
              languageNode: node,
              severity: "warning",
              data: diagnosticData(
                node.operator === "=="
                  ? "condition-is-always-false"
                  : "condition-is-always-true"
              ),
            })
          ),
      })
      .finish();
  }

  typir.factory.Operators.createBinary({
    name: "=",
    signature: {
      left: typeAny,
      right: typeAny,
      return: typeAny,
    },
  })
    .inferenceRule({
      ...binaryInferenceRule,
      validation: [
        (node, _opName, _opType, accept, typir) =>
          typir.validation.Constraints.ensureNodeIsAssignable(
            node.right,
            node.left,
            accept,
            (actual, expected) => ({
              message: `The expression '${node.right.$cstNode?.text}' of type '${actual.name}' is not assignable to '${node.left.$cstNode?.text}' with type '${expected.name}'`,
              languageProperty: "value",
            })
          ),
        (node, _opName, _opType, accept, _typir) => {
          if (
            isReferenceExpression(node.left) &&
            isConstantDeclaration(node.left.element.ref)
          ) {
            accept({
              message: `The constant '${node.left.element.ref.name}' value can't be re-assigned.`,
              languageNode: node,
              languageProperty: "operator",
              severity: "error",
            });
          }
        },
      ],
    })
    .finish();
}
