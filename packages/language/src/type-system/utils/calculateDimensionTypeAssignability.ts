import { ConversionMode, CustomType, Type } from "typir";
import {
  DimensionType,
  isDimensionType,
} from "../custom-types/dimension/Dimension.type.js";
import { isUnitType, UnitType } from "../custom-types/unit/Unit.type.js";
import { ELangSpecifics } from "../ELangSpecifics.interface.js";
import { DimensionCalculator, DimensionVector } from "./DimensionCalculator.js";

export function calculateDimensionTypeAssignability(
  source:
    | CustomType<DimensionType, ELangSpecifics>
    | CustomType<UnitType, ELangSpecifics>,
  target: Type
): ConversionMode {
  //   if (!("properties" in source) ||
  //     // !isUnitType(source.properties) ||
  //     !("properties" in target) //||
  //     // (!isDimensionType(target.properties) && !isUnitType(target.properties))) {
  // ) {
  //     return "NONE";
  //   }

  if (
    !("properties" in target) ||
    !isDimensionType(target.properties) ||
    !isUnitType(target.properties)
  ) {
    return "NONE";
  }

  return DimensionCalculator.areVectorsEqual(
    source.properties.vector as DimensionVector,
    target.properties.vector
  )
    ? "EXPLICIT"
    : "NONE";
}
