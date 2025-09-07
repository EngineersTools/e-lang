import { DimensionDeclaration } from "../../../generated/ast.js";
import { ElangTypirServices } from "../../ELangAdditionalTypirServices.type.js";
import { createMeasurementTypeForUnit } from "../measurement/createMeasurementType.js";

export function createDimensionType(
  languageNode: DimensionDeclaration,
  typir: ElangTypirServices
) {
  const dimensionType = typir.factory.Dimension.create({
    properties: {
      name: languageNode.name,
      description: languageNode.description ?? "",
      units: languageNode.units.map((unit) => ({
        name: unit.name,
        description: unit.description ?? "",
        longName: unit.longName ?? "",
      })),
      base: languageNode.base
        ? languageNode.base.elements.map((base) => ({
            base: base.base.ref?.name ?? "Unknown Dimension",
            exponent: base.exponent
              ? base.negativeExponent
                ? -Math.abs(base.exponent)
                : base.exponent
              : 1,
          }))
        : [],
    },
  })
    .inferenceRule({
      languageKey: DimensionDeclaration.$type,
      matching: (node: DimensionDeclaration) => languageNode === node,
    })
    .finish()
    .getTypeFinal();

  if (dimensionType && languageNode.units.length > 0) {
    for (const unit of languageNode.units) {
      const measurementType = createMeasurementTypeForUnit(unit.name, typir);

      if (measurementType) {
        typir.Conversion.markAsConvertible(
          measurementType,
          dimensionType,
          "IMPLICIT_EXPLICIT"
        );
      }
    }
  }

  return dimensionType;
}
