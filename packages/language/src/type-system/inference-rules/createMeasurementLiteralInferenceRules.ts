import { InferenceRuleNotApplicable } from "typir";
import { ElangTypirServices } from "../ELangAdditionalTypirServices.type.js";

export function createMeasurementLiteralInferenceRules(
  typir: ElangTypirServices
) {
  typir.Inference.addInferenceRulesForAstNodes({
    MeasurementLiteral: (node) => {
        if (node.unit?.ref) {
            const unitName = node.unit.ref.name;
            // Find the measurement type corresponding to this unit
            const ref = typir.factory.Measurement.get({ unit: { name: unitName } as any });
            if (ref) {
                // @ts-ignore
                return ref.type ?? ref;
            }
        }
        return InferenceRuleNotApplicable;
    }
  });
}
