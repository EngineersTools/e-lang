import { UnitDeclaration } from "../../../generated/ast.js";
import { ELangTypirServices } from "../../ELangAdditionalTypirServices.type.js";
import { DimensionCalculator } from "../../utils/DimensionCalculator.js";

export function createUnitType(
  languageNode: UnitDeclaration,
  typir: ELangTypirServices,
  calculator: DimensionCalculator
) {
  const vector = calculator.compute(languageNode);

  return typir.factory.Unit.create({
    properties: {
      name: languageNode.name,
      vector: vector
    },
  })
    .inferenceRule({
      languageKey: UnitDeclaration.$type,
      matching: (node: UnitDeclaration) => languageNode === node,
    })
    .finish()
    .getTypeFinal();
}
