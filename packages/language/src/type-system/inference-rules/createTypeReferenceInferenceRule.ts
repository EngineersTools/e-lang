import { InferenceRuleNotApplicable } from "typir";
import { TypirLangiumServices } from "typir-langium";
import { ELangSpecifics } from "../ELangSpecifics.interface.js";

export function createTypeReferenceInferenceRules(
  typir: TypirLangiumServices<ELangSpecifics>
) {
  typir.Inference.addInferenceRulesForAstNodes({
    TypeReference: (node) => node.reference?.ref ?? InferenceRuleNotApplicable,
  });
}
