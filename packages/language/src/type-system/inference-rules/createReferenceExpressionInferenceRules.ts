import { InferenceRuleNotApplicable, isType } from "typir";
import {
  isBinaryExpression,
  isParameterDeclaration,
  isReferenceExpression,
} from "../../generated/ast.js";
import { isMeasurementKind } from "../custom-types/measurement/isMeasurementKind.js";
import { ElangTypirServices } from "../ELangAdditionalTypirServices.type.js";
import { getOrCreateTypeNull } from "../typir-types/createPrimitives.js";

export function createReferenceExpressionInferenceRules(
  typir: ElangTypirServices
) {
  const typeNull = getOrCreateTypeNull(typir);

  typir.Inference.addInferenceRulesForAstNodes({
    ReferenceExpression: (node) => {
      if (isBinaryExpression(node.$container)) {
        const parent = node.$container;
        if (
          parent.operator === "=" &&
          !isReferenceExpression(parent.right) &&
          isReferenceExpression(parent.left) &&
          parent.left.element.ref
        ) {
          const variableType = typir.Inference.inferType(
            parent.left.element.ref
          );
          const valueType = typir.Inference.inferType(parent.right);

          if (
            isType(variableType) &&
            variableType === typeNull &&
            isType(valueType) &&
            valueType !== typeNull
          ) {
            typir.caching.LanguageNodeInference.cacheSet(
              node.element.ref,
              valueType
            );
            return parent.right;
          }
        } else if (
          parent.operator === "*" &&
          isReferenceExpression(parent.left) &&
          isReferenceExpression(parent.right) &&
          parent.left.element.ref &&
          parent.right.element.ref
        ) {
          const leftType = typir.Inference.inferType(parent.left.element.ref);
          const rightType = typir.Inference.inferType(parent.right.element.ref);

          if (isMeasurementKind(leftType) && isMeasurementKind(rightType)) {
            // typir.caching.LanguageNodeInference.cacheSet(
            //   node.element.ref,
            //   rightType
            // );
            return parent.right.element.ref ?? InferenceRuleNotApplicable;
          }

          return parent.left.element.ref ?? InferenceRuleNotApplicable;
        }
      } else if (isParameterDeclaration(node.element.ref)) {
        return node.element.ref.type;
      }

      return node.element.ref ?? InferenceRuleNotApplicable;
    },
  });
}
