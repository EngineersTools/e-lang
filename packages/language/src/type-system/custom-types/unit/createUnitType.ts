import { UnitDeclaration } from "../../../generated/ast.js";
import { ELangTypirServices } from "../../ELangAdditionalTypirServices.type.js";
import { DimensionCalculator } from "../../utils/DimensionCalculator.js";
import { isDimensionType } from "../dimension/Dimension.type.js";

export function createUnitType(
  languageNode: UnitDeclaration,
  typir: ELangTypirServices,
  calculator: DimensionCalculator
) {
  const vector = calculator.compute(languageNode);

  if (
    languageNode.dimension &&
    languageNode.dimension.ref &&
    languageNode.expression
  ) {
    const dimensionType = typir.Inference.inferType(languageNode.dimension.ref);
    if (
      isDimensionType(dimensionType) &&
      "properties" in dimensionType &&
      isDimensionType(dimensionType.properties)
    ) {
      const dimensionVector = dimensionType.properties.vector;
      if (!DimensionCalculator.areVectorsEqual(vector, dimensionVector)) {
        throw new Error(
          `The unit '${languageNode.name}' definition is incompatible with its dimension '${languageNode.dimension.ref.name}'.`
        );
      }
    }
  }

  return typir.factory.Unit.create({
    associatedLanguageNode: languageNode,
    properties: {
      name: languageNode.name,
      vector: vector,
    },
  })
    .inferenceRule({
      languageKey: UnitDeclaration.$type,
      matching: (node: UnitDeclaration) => languageNode === node,
    })
    .finish()
    .getTypeFinal();
}
