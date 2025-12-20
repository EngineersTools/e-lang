import { MeasurementLiteral } from "../../../generated/ast.js";
import { ElangTypirServices } from "../../ELangAdditionalTypirServices.type.js";
import { DimensionCalculator } from "../../../dimension-calculator.js";

export function createMeasurementType(
  languageNode: MeasurementLiteral,
  typir: ElangTypirServices,
  calculator?: DimensionCalculator
) {
  if (!languageNode.unit.ref) {
    throw new Error("Unit reference is undefined in MeasurementLiteral");
  }

  const unitName = languageNode.unit.ref.name;
  
  // Try to find existing measurement type first
  const existingMeasurement = typir.factory.Measurement.get({ unit: { name: unitName } as any });
  if (existingMeasurement) {
    return existingMeasurement;
  }

  // Calculate vector. If calculator is not provided, we might fail or need to instantiate one.
  // Ideally it should be provided.
  const calc = calculator ?? new DimensionCalculator(); 
  const vector = calc.compute(languageNode.unit.ref);

  return typir.factory.Measurement.create({
    properties: {
      unit: {
        name: unitName,
        vector: vector
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

