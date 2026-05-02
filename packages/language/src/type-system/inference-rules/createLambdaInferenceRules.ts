import { isType } from "typir";
import { FormulaDeclaration, LambdaExpression, LambdaType } from "../../generated/ast.js";
import { ELangTypirServices } from "../ELangAdditionalTypirServices.type.js";
import { getOrCreateFunctionType } from "../typir-types/createFunctionType.js";
import { getOrCreateTypeAny } from "../typir-types/createPrimitives.js";

export function createLambdaInferenceRules(typir: ELangTypirServices) {
  typir.Inference.addInferenceRulesForAstNodes({
    LambdaType: (node: LambdaType) => {
        const inputs = (node.parameters || []).map((param, index) => {
            const inferred = typir.Inference.inferType(param);
            return { name: `p${index}`, type: isType(inferred) ? inferred : getOrCreateTypeAny(typir) };
        });
        const returnType = node.returnType ? typir.Inference.inferType(node.returnType) : undefined;
        return getOrCreateFunctionType(
            inputs,
            isType(returnType) ? returnType : undefined,
            typir
        );
    },
    LambdaExpression: (node: LambdaExpression) => {
        const inputs = (node.parameters || []).map(param => {
            const inferred = typir.Inference.inferType(param.type);
            return { name: param.name, type: isType(inferred) ? inferred : getOrCreateTypeAny(typir) };
        });
        const returnType = node.returnType ? typir.Inference.inferType(node.returnType) : undefined;
        return getOrCreateFunctionType(
            inputs,
            isType(returnType) ? returnType : undefined,
            typir
        );
    },
    FormulaDeclaration: (node: FormulaDeclaration) => {
        const inputs = (node.parameters || []).map(param => {
            const inferred = typir.Inference.inferType(param.type);
            return { name: param.name, type: isType(inferred) ? inferred : getOrCreateTypeAny(typir) };
        });
        const returnType = node.returnType ? typir.Inference.inferType(node.returnType) : undefined;
        return getOrCreateFunctionType(
            inputs,
            isType(returnType) ? returnType : undefined,
            typir
        );
    }
  });
}
