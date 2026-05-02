import { InferenceRuleNotApplicable, isFunctionType } from "typir";
import { CallExpression } from "../../generated/ast.js";
import { ELangTypirServices } from "../ELangAdditionalTypirServices.type.js";

export function createCallExpressionInferenceRules(typir: ELangTypirServices) {
    typir.Inference.addInferenceRulesForAstNodes({
        CallExpression: (node: CallExpression) => {
            const calleeType = typir.Inference.inferType(node.callee);
            if (isFunctionType(calleeType)) {
                return calleeType.getOutput()?.type ?? InferenceRuleNotApplicable;
            }
            return InferenceRuleNotApplicable;
        },
    });
}
