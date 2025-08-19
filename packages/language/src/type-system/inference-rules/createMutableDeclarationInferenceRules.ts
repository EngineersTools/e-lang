import { InferenceRuleNotApplicable } from "typir";
import { TypirLangiumServices } from "typir-langium";
import { ELangSpecifics } from "../ELangSpecifics.interface.js";

export function createMutableDeclarationInferenceRules(
  typir: TypirLangiumServices<ELangSpecifics>
) {
  typir.Inference.addInferenceRulesForAstNodes({
    MutableDeclaration: (languageNode) => {
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
