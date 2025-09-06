import { MeasurementLiteral } from "../../../generated/ast.js";
import { ElangTypirServices } from "../../ELangAdditionalTypirServices.type.js";

export function createMeasurementType(
  languageNode: MeasurementLiteral,
  typir: ElangTypirServices
) {
  if (!languageNode.unit.ref) {
    throw new Error("Unit reference is undefined in MeasurementLiteral");
  }

  return typir.factory.Measurement.create({
    properties: {
      unit: {
        name: languageNode.unit.ref.name,
      },
    },
  })
    .inferenceRule({
      languageKey: MeasurementLiteral.$type,
      matching: (node: MeasurementLiteral) =>
        languageNode === node && languageNode.unit.ref !== undefined,
    })
    .finish()
    .getTypeFinal();
}

export function createMeasurementTypeForUnit(
  unitName: string,
  typir: ElangTypirServices
) {
  return typir.factory.Measurement.create({
    properties: {
      unit: { name: unitName },
    },
  })
    .finish()
    .getTypeFinal();
}
