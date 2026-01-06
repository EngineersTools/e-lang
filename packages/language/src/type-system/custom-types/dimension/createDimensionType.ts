import { DimensionDeclaration } from "../../../generated/ast.js";
import { ELangTypirServices } from "../../ELangAdditionalTypirServices.type.js";
import { DimensionCalculator } from "../../utils/DimensionCalculator.js";

export function createDimensionType(
    languageNode: DimensionDeclaration,
    typir: ELangTypirServices,
    calculator: DimensionCalculator
) {

  const vector = calculator.compute(languageNode);

    return typir.factory.Dimension.create({
        properties: {
            name: languageNode.name,
            vector
        },
    })
        .inferenceRule({
            languageKey: DimensionDeclaration.$type,
            matching: (node: DimensionDeclaration) => languageNode === node,
        })
        .finish()
        .getTypeFinal();
}
