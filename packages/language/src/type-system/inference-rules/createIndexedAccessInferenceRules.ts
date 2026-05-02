import { InferenceRuleNotApplicable, isMultiplicityType } from "typir";
import { IndexedAccess } from "../../generated/ast.js";
import { ELangTypirServices } from "../ELangAdditionalTypirServices.type.js";

export function createIndexedAccessInferenceRules(typir: ELangTypirServices) {
    typir.Inference.addInferenceRulesForAstNodes({
        IndexedAccess: (node: IndexedAccess) => {
            const receiverType = typir.Inference.inferType(node.receiver);
            if (isMultiplicityType(receiverType)) {
                return receiverType.constrainedType;
            }
            return InferenceRuleNotApplicable;
        },
    });
}
