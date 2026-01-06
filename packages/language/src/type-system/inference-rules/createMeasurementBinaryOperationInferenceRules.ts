import { InferenceRuleNotApplicable, isCustomType, isType } from "typir";
import { isConstantDeclaration, isReferenceExpression } from "../../index.js";
import { isDimensionType } from "../custom-types/dimension/Dimension.type.js";
import { isUnitType } from "../custom-types/unit/Unit.type.js";
import { ELangTypirServices } from "../ELangAdditionalTypirServices.type.js";
import { DimensionCalculator } from "../utils/DimensionCalculator.js";

export function createMeasurementBinaryOperationInferenceRules(
  typir: ELangTypirServices
) {
  typir.Inference.addInferenceRulesForAstNodes({
    BinaryExpression: (languageNode) => {
      const leftType = typir.Inference.inferType(languageNode.left);
      const rightType = typir.Inference.inferType(languageNode.right);

      if (isCustomType(leftType, "Unit") && isCustomType(rightType, "Unit")) {
        return leftType;
      }

      return InferenceRuleNotApplicable
    },
  });

  typir.validation.Collector.addValidationRulesForAstNodes({
    BinaryExpression: [
      (node, accept) => {
        if (["+", "-", "="].includes(node.operator)) {
          const leftType = typir.Inference.inferType(node.left);
          const rightType = typir.Inference.inferType(node.right);

          if (
            isType(leftType) &&
            isType(rightType) &&
            ('properties' in leftType) &&
            ('properties' in rightType) &&
            (isDimensionType(leftType.properties) || isUnitType(leftType.properties)) &&
            (isDimensionType(rightType.properties) || isUnitType(rightType.properties)) &&
            !DimensionCalculator.areVectorsEqual(leftType.properties.vector, rightType.properties.vector)
          ) {
            accept({
              message: `You are trying to add, subtract or assign two measurements with units of different dimensions ('${leftType.getName()}' and '${rightType.getName()}').`,
              languageNode: node,
              severity: "error",
            });
          }
        }

        if (["="].includes(node.operator) && isReferenceExpression(node.left) &&
          isConstantDeclaration(node.left.element.ref)) {
          accept({
            message: `The constant '${node.left.element.ref.name}' value can't be re-assigned.`,
            languageNode: node,
            languageProperty: "operator",
            severity: "error",
          });
        }
      },
    ],
  });
}
