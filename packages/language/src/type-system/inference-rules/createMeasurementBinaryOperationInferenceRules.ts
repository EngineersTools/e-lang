import { InferenceRuleNotApplicable, isCustomType } from "typir";
import { ElangTypirServices } from "../ELangAdditionalTypirServices.type.js";

export function createMeasurementBinaryOperationInferenceRules(
  typir: ElangTypirServices
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
}
