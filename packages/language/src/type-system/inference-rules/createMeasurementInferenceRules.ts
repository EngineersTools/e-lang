import { InferenceRuleNotApplicable, isType } from "typir";
import { ELangTypirServices } from "../ELangAdditionalTypirServices.type.js";

export function createMeasurementInferenceRules(typir: ELangTypirServices) {
  typir.Inference.addInferenceRulesForAstNodes({
    Measurement: (languageNode) => {
      if (languageNode.unit.ref) {
        const inferedType = typir.Inference.inferType(languageNode.unit.ref);

        if (isType(inferedType)) {
          return inferedType;
        }
      }

      return InferenceRuleNotApplicable;
    },
  });
}
