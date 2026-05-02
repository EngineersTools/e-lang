import { InferenceRuleNotApplicable, isType } from "typir";
import { ListExpression } from "../../generated/ast.js";
import { ELangTypirServices } from "../ELangAdditionalTypirServices.type.js";
import { getOrCreateTypeAny, getOrCreateTypeList } from "../typir-types/createPrimitives.js";

export function createListExpressionInferenceRules(typir: ELangTypirServices) {
    typir.Inference.addInferenceRulesForAstNodes({
        ListExpression: (node: ListExpression) => {
            if (!node.elements || node.elements.length === 0) {
                // Empty list -> List[Any]
                const anyType = getOrCreateTypeAny(typir);
                return getOrCreateTypeList(anyType, typir);
            }

            // Find the first valid type from elements
            let elementType: any = undefined;
            for (const element of node.elements) {
                const inferredType = typir.Inference.inferType(element);
                if (isType(inferredType)) {
                    elementType = inferredType;
                    break;
                }
            }

            if (elementType) {
                return getOrCreateTypeList(elementType, typir);
            }

            return InferenceRuleNotApplicable;
        },
    });
}
