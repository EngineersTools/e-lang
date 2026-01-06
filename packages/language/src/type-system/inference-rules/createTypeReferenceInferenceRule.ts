import { InferenceRuleNotApplicable } from "typir";
import { ELangTypirServices } from "../ELangAdditionalTypirServices.type.js";

export function createTypeReferenceInferenceRules(typir: ELangTypirServices) {
  typir.Inference.addInferenceRulesForAstNodes({
    TypeReference: (node) => node.reference?.ref ?? InferenceRuleNotApplicable,
  });
}
