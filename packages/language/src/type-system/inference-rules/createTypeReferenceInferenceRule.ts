import { InferenceRuleNotApplicable } from "typir";
import { ElangTypirServices } from "../ELangAdditionalTypirServices.type.js";

export function createTypeReferenceInferenceRules(typir: ElangTypirServices) {
  typir.Inference.addInferenceRulesForAstNodes({
    TypeReference: (node) => node.reference?.ref ?? InferenceRuleNotApplicable,
  });
}
