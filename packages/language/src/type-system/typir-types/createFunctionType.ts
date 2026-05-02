import { Type, NO_FUNCTION_NAME } from "typir";
import { ELangTypirServices } from "../ELangAdditionalTypirServices.type.js";
import { getOrCreateTypeAny } from "./createPrimitives.js";

export function getOrCreateFunctionType(
    inputs: Array<{ name: string; type: Type }>,
    output: Type | undefined,
    typir: ELangTypirServices
): Type {
    const outputType = output ?? getOrCreateTypeAny(typir);
    
    const details = {
        functionName: NO_FUNCTION_NAME,
        inputParameters: inputs,
        outputParameter: { name: "return", type: outputType }
    };

    let funcRef = typir.factory.Functions.get(details);
    if (funcRef) {
        const type = funcRef.getType();
        if (type) return type;
    }
    
    return typir.factory.Functions.create(details).finish().getTypeInitial();
}
