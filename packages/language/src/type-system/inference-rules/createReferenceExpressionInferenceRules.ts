import { InferenceRuleNotApplicable, isType } from "typir";
import {
  isBinaryExpression,
  isConstantDeclaration,
  isMutableDeclaration,
  isParameterDeclaration,
  isReferenceExpression,
} from "../../generated/ast.js";
import { ELangTypirServices } from "../ELangAdditionalTypirServices.type.js";
import { getOrCreateTypeNull } from "../typir-types/createPrimitives.js";

export function createReferenceExpressionInferenceRules(
  typir: ELangTypirServices
) {
  const typeNull = getOrCreateTypeNull(typir);

  typir.Inference.addInferenceRulesForAstNodes({
    ReferenceExpression: (node) => {
      if (
        isConstantDeclaration(node.element.ref) ||
        isMutableDeclaration(node.element.ref)
      ) {
        return node.element.ref.type ?? node.element.ref.value ?? InferenceRuleNotApplicable;
      } else if (isBinaryExpression(node.$container)) {
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
        }
      } else if (isParameterDeclaration(node.element.ref)) {
        return node.element.ref.type;
      }

      return node.element.ref ?? InferenceRuleNotApplicable;
    },
  });
}
