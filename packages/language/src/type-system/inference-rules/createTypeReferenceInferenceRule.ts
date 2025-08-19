import { InferenceRuleNotApplicable } from "typir";
import { TypirLangiumServices } from "typir-langium";
import { ELangSpecifics } from "../ELangSpecifics.interface.js";

export function createConstantDeclarationInferenceRules(
  typir: TypirLangiumServices<ELangSpecifics>
) {
  typir.Inference.addInferenceRulesForAstNodes({
    TypeReference: (node) => node.model?.ref ?? InferenceRuleNotApplicable,
  });
}
