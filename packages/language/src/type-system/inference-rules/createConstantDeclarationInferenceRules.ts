import { InferenceRuleNotApplicable } from "typir";
import { TypirLangiumServices } from "typir-langium";
import { ELangSpecifics } from "../ELangSpecifics.interface.js";

export function createConstantDeclarationInferenceRules(
  typir: TypirLangiumServices<ELangSpecifics>
) {
  typir.Inference.addInferenceRulesForAstNodes({
    ConstantDeclaration: (languageNode) => {
      if (languageNode.type) {
        return languageNode.type;
      } else if (languageNode.value) {
        return languageNode.value;
      } else {
        return InferenceRuleNotApplicable;
      }
    },
  });
}
