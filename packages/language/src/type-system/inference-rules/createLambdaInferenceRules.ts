import { InferenceRuleNotApplicable } from "typir";
import { ELangTypirServices } from "../ELangAdditionalTypirServices.type.js";

export function createLambdaInferenceRules(typir: ELangTypirServices) {
  typir.Inference.addInferenceRulesForAstNodes({
    LambdaType: (node) => node.returnType ?? InferenceRuleNotApplicable,
  });
}
