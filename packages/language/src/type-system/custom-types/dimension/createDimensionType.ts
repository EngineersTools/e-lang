import { DimensionDeclaration } from "../../../generated/ast.js";
import { ElangTypirServices } from "../../ELangAdditionalTypirServices.type.js";
import { DimensionCalculator } from "../../utils/dimension-calculator.js";

export function createDimensionType(
    languageNode: DimensionDeclaration,
    typir: ElangTypirServices,
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
