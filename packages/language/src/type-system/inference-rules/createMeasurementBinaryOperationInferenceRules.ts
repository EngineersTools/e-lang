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
      // (node, accept) => {
      //   if (
      //     ["+", "-", "="].includes(node.operator) &&
      //     isMeasurementLiteral(node.left) &&
      //     isMeasurementLiteral(node.right) &&
      //     isDimensionDeclaration(node.left.unit.ref?.$container) &&
      //     isDimensionDeclaration(node.right.unit.ref?.$container) &&
      //     node.left.unit.ref?.$container.name !==
      //       node.right.unit.ref?.$container.name
      //   ) {
      //     accept({
      //       message: `You are trying to add, subtract or assign two measurements with units of different dimensions ('${node.left.unit.ref.name}:${node.left.unit.ref?.$container.name}' and '${node.right.unit.ref.name}:${node.right.unit.ref?.$container.name}').`,
      //       languageNode: node,
      //       severity: "error",
      //     });
      //   }
      // },
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
