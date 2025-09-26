import { InferenceRuleNotApplicable } from "typir";
import {
    isDimensionDeclaration,
    isMeasurementLiteral,
} from "../../generated/ast.js";
import { ElangTypirServices } from "../ELangAdditionalTypirServices.type.js";

export function createMeasurementBinaryOperationInferenceRules(
  typir: ElangTypirServices
) {
  typir.Inference.addInferenceRulesForAstNodes({
    BinaryExpression: (languageNode) => {
      if (isMeasurementLiteral(languageNode.left)) {
        return languageNode.left.unit.ref?.$container ?? languageNode;
      } else if (isMeasurementLiteral(languageNode.right)) {
        return languageNode.right.unit.ref?.$container ?? languageNode;
      } else {
        return InferenceRuleNotApplicable;
      }
    },
  });

  typir.validation.Collector.addValidationRulesForAstNodes({
    BinaryExpression: (node, accept) => {
      if (
        isMeasurementLiteral(node.left) &&
        isMeasurementLiteral(node.right) &&
        isDimensionDeclaration(node.left.unit.ref?.$container) &&
        isDimensionDeclaration(node.right.unit.ref?.$container) &&
        node.left.unit.ref?.$container.name !==
          node.right.unit.ref?.$container.name
      ) {
        accept({
          message: `You are trying to add two measurements with units of different dimensions ('${node.left.unit.ref.name}:${node.left.unit.ref?.$container.name}' and '${node.right.unit.ref.name}:${node.right.unit.ref?.$container.name}').`,
          languageNode: node,
          severity: "error",
        });
      }
    },
  });
}
