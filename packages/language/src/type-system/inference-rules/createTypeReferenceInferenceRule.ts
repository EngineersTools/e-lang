import { InferenceRuleNotApplicable, isType } from "typir";
import { ELangTypirServices } from "../ELangAdditionalTypirServices.type.js";
import {
  getOrCreateTypeBool,
  getOrCreateTypeNumber,
  getOrCreateTypeText,
} from "../typir-types/createPrimitives.js";

export function createTypeReferenceInferenceRules(typir: ELangTypirServices) {
  typir.Inference.addInferenceRulesForAstNodes({
    TypeReference: (node) => {
        if (node.primitive) {
            switch (node.primitive) {
                case "number": return getOrCreateTypeNumber(typir);
                case "text": return getOrCreateTypeText(typir);
                case "boolean": return getOrCreateTypeBool(typir);
            }
        }
        if (node.reference?.ref) {
            const type = typir.Inference.inferType(node.reference.ref);
            if (isType(type)) return type;
        }
        return InferenceRuleNotApplicable;
    },
  });
}
