import {
  InferenceRuleNotApplicable
} from "typir";
import { ELangTypirServices } from "../ELangAdditionalTypirServices.type.js";
import { validateVariableDeclaration } from "../utils/validateVariableDeclaration.js";

export function createMutableDeclarationInferenceRules(
  typir: ELangTypirServices
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

  typir.validation.Collector.addValidationRulesForAstNodes({
    MutableDeclaration: validateVariableDeclaration,
  });
}