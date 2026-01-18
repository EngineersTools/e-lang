import { InferenceRuleNotApplicable, isType } from "typir";
import { ELangTypirServices } from "../ELangAdditionalTypirServices.type.js";

export function createParameterDeclarationInferenceRules(typir: ELangTypirServices) {
  typir.Inference.addInferenceRulesForAstNodes({
    ParameterDeclaration: (node) => {
        if (node.type) {
            const type = typir.Inference.inferType(node.type);
            if (isType(type)) return type;
        }
        return InferenceRuleNotApplicable;
    },
  });
}
