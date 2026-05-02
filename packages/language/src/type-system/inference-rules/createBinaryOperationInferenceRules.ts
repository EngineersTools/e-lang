import { diagnosticData } from "langium";
import { InferOperatorWithMultipleOperands, isCustomType } from "typir";
import {
  BinaryExpression,
  isConstantDeclaration,
  isReferenceExpression
} from "../../generated/ast.js";
import { ELangTypirServices } from "../ELangAdditionalTypirServices.type.js";
import { ELangSpecifics } from "../ELangSpecifics.interface.js";
import {
  createTypeAny,
  getOrCreateTypeBool,
  getOrCreateTypeNumber,
  getOrCreateTypeText,
  getOrCreateTypeComplex,
} from "../typir-types/createPrimitives.js";

export function createBinaryOperationInferenceRules(typir: ELangTypirServices) {
  const typeAny = createTypeAny(typir);
  const typeNumber = getOrCreateTypeNumber(typir);
  const typeText = getOrCreateTypeText(typir);
  const typeBoolean = getOrCreateTypeBool(typir);
  const typeComplex = getOrCreateTypeComplex(typir);

  const binaryInferenceRule: InferOperatorWithMultipleOperands<
    ELangSpecifics,
    BinaryExpression
  > = {
    languageKey: BinaryExpression.$type,
    matching: (node: BinaryExpression, name: string) => {
      const leftType = typir.Inference.inferType(node.left);
      const rightType = typir.Inference.inferType(node.right);

      const isCustomLeftUnit = isCustomType(leftType, "Unit");
      const isCustomRightUnit = isCustomType(rightType, "Unit");
      const isCustomLeftModel = isCustomType(leftType, "Model");
      const isCustomRightModel = isCustomType(rightType, "Model");

      if (isCustomLeftUnit || isCustomRightUnit || isCustomLeftModel || isCustomRightModel) {
        return false;
      }

      return node.operator === name;
    },
    operands: (node: BinaryExpression, _name: string) => [
      node.left,
      node.right,
    ],
    validateArgumentsOfCalls: true,
  };

  for (const operator of ["-", "*", "/"]) {
    typir.factory.Operators.createBinary({
      name: operator,
      signatures: [
        { left: typeNumber, right: typeNumber, return: typeNumber },
        { left: typeNumber, right: typeComplex, return: typeComplex },
        { left: typeComplex, right: typeNumber, return: typeComplex },
        { left: typeComplex, right: typeComplex, return: typeComplex },
      ],
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
      { left: typeNumber, right: typeComplex, return: typeComplex },
      { left: typeComplex, right: typeNumber, return: typeComplex },
      { left: typeComplex, right: typeComplex, return: typeComplex },
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

  for (const operator of ["==", "equal", "!=", "notequal"]) {
    typir.factory.Operators.createBinary({
      name: operator,
      signature: { left: typeAny, right: typeAny, return: typeBoolean },
    })
      .inferenceRule({
        ...binaryInferenceRule,
        validation: (node, _operatorName, _operatorType, accept, typir) =>
          typir.validation.Constraints.ensureNodeIsEquals(
            node.right,
            node.left,
            accept,
            (actual, expected) => ({
              message: `This comparison will always return '${node.operator === "equal" ? "false" : "true"
                }' as '${node.left.$cstNode?.text}' and '${node.right.$cstNode?.text
                }' have the different types '${actual.name}' and '${expected.name
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
            node.left,
            node.right,
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
