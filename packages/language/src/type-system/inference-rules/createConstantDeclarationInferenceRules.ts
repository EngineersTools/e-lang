import {
  InferenceRuleNotApplicable} from "typir";
import { ELangTypirServices } from "../ELangAdditionalTypirServices.type.js";
import { validateVariableDeclaration } from "../utils/validateVariableDeclaration.js";

export function createConstantDeclarationInferenceRules(
  typir: ELangTypirServices
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

  typir.validation.Collector.addValidationRulesForAstNodes({
    ConstantDeclaration: validateVariableDeclaration,
  });
}


