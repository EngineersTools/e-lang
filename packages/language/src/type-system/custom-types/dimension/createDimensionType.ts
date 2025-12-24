import { DimensionDeclaration } from "../../../generated/ast.js";
import { ElangTypirServices } from "../../ELangAdditionalTypirServices.type.js";

export function createDimensionType(
    languageNode: DimensionDeclaration,
    typir: ElangTypirServices
) {

    return typir.factory.Dimension.create({
        properties: {
            name: languageNode.name,
        },
    })
        .inferenceRule({
            languageKey: DimensionDeclaration.$type,
            matching: (node: DimensionDeclaration) => languageNode === node,
        })
        .finish()
        .getTypeFinal();
}
