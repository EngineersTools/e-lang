import { InferenceRuleNotApplicable, isType } from "typir";
import { isMeasurementLiteral } from "../../generated/ast.js";
import { ElangTypirServices } from "../ELangAdditionalTypirServices.type.js";

export function createMeasurementBinaryOperationInferenceRules(
  typir: ElangTypirServices
) {
  typir.Inference.addInferenceRulesForAstNodes({
    BinaryExpression: (languageNode) => {
      if (["+", "-", "="].includes(languageNode.operator)) {
        if (isMeasurementLiteral(languageNode.left)) {
          return languageNode.left.unit.ref?.$container ?? languageNode;
        } else if (isMeasurementLiteral(languageNode.right)) {
          return languageNode.right.unit.ref?.$container ?? languageNode;
        } else {
          return InferenceRuleNotApplicable;
        }
      } else {
        return InferenceRuleNotApplicable;
      }
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
            typir.Conversion.isConvertible(leftType, rightType) === false
          ) {
            accept({
              message: `You are trying to add, subtract or assign two measurements with units of different dimensions ('${leftType.getName()}' and '${rightType.getName()}').`,
              languageNode: node,
              severity: "error",
            });
          }
        }
      },
    ],
  });
}
