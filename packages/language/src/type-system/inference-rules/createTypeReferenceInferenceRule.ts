import { InferenceRuleNotApplicable, isType } from "typir";
import { ELangTypirServices } from "../ELangAdditionalTypirServices.type.js";
import {
  getOrCreateTypeBool,
  getOrCreateTypeNumber,
  getOrCreateTypeText,
  getOrCreateTypeList,
  getOrCreateTypeNull,
} from "../typir-types/createPrimitives.js";

export function createTypeReferenceInferenceRules(typir: ELangTypirServices) {
  typir.Inference.addInferenceRulesForAstNodes({
    TypeReference: (node) => {
        let inferredType: any = undefined;
        if (node.primitive) {
            switch (node.primitive) {
                case "number": inferredType = getOrCreateTypeNumber(typir); break;
                case "text": inferredType = getOrCreateTypeText(typir); break;
                case "boolean": inferredType = getOrCreateTypeBool(typir); break;
                case "null": inferredType = getOrCreateTypeNull(typir); break;
            }
        } else if ((node as any).reference?.ref) {
            const type = typir.Inference.inferType((node as any).reference.ref);
            if (isType(type)) {
                inferredType = type;
            }
        }
        
        if (inferredType && (node as any).arrayDimensions?.length > 0) {
            let currentType = inferredType;
            for (let i = 0; i < (node as any).arrayDimensions.length; i++) {
                currentType = getOrCreateTypeList(currentType, typir);
            }
            return currentType;
        } else if (inferredType) {
            return inferredType;
        }

        return InferenceRuleNotApplicable;
    },
  });
}
