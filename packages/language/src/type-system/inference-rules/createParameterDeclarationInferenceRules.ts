import { InferenceRuleNotApplicable } from "typir";
import { ELangTypirServices } from "../ELangAdditionalTypirServices.type.js";

export function createParameterDeclarationInferenceRules(typir: ELangTypirServices) {
  typir.Inference.addInferenceRulesForAstNodes({
    ParameterDeclaration: (node) => node.type ?? InferenceRuleNotApplicable,
  });
}
