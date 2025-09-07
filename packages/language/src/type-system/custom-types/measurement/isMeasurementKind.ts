import { CustomType, isType } from "typir";
import { MeasurementType } from "./Measurement.type.js";
import { ELangSpecifics } from "../../ELangSpecifics.interface.js";

export function isMeasurementKind(
  type: any
): type is CustomType<MeasurementType, ELangSpecifics> {
  return isType(type) && type.kind.$name === "CustomKind-Measurement";
}
