import { InferenceRuleNotApplicable } from "typir";
import { ElangTypirServices } from "../ELangAdditionalTypirServices.type.js";

export function createMeasurementLiteralInferenceRules(
  typir: ElangTypirServices
) {
  typir.Inference.addInferenceRulesForAstNodes({
    MeasurementLiteral: (node) =>
      node.unit.ref?.$container ?? InferenceRuleNotApplicable,
  });
}
