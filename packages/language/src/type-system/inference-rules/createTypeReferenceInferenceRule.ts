import { InferenceRuleNotApplicable } from "typir";
import { TypirLangiumServices } from "typir-langium";
import { ELangSpecifics } from "../ELangSpecifics.interface.js";

export function createTypeReferenceInferenceRules(
  typir: TypirLangiumServices<ELangSpecifics>
) {
  typir.Inference.addInferenceRulesForAstNodes({
    TypeReference: (node) => {
      console.log("Inferring type for:", node);
      return node.model
        ? node.model.ref ?? InferenceRuleNotApplicable
        : node.dimension
        ? node.dimension.ref ?? InferenceRuleNotApplicable
        : InferenceRuleNotApplicable;
    },
  });
}
