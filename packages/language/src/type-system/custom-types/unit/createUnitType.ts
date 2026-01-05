import { DimensionCalculator } from "../../../dimension-calculator.js";
import { UnitDeclaration } from "../../../generated/ast.js";
import { ElangTypirServices } from "../../ELangAdditionalTypirServices.type.js";

export function createUnitType(
  languageNode: UnitDeclaration,
  typir: ElangTypirServices,
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
