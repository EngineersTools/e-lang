import { ConversionMode, Type } from "typir";
import { isDimensionType } from "../custom-types/dimension/Dimension.type.js";
import { isUnitType } from "../custom-types/unit/Unit.type.js";
import { DimensionCalculator } from "./DimensionCalculator.js";


export function calculateDimensionTypeAssignability(
  source: Type,
  target: Type
): ConversionMode {
  if (!("properties" in source) ||
    !isUnitType(source.properties) ||
    !("properties" in target) ||
    (!isDimensionType(target.properties) && !isUnitType(target.properties))) {
    return "NONE";
  }

  console.log("Comparing dimension vectors:", source.properties.vector, target.properties.vector);

  return DimensionCalculator.areVectorsEqual(source.properties.vector, target.properties.vector)
    ? "IMPLICIT_EXPLICIT"
    : "NONE";
}
