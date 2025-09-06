import { CustomKind } from "typir";
import { ElangTypirServices } from "../../ELangAdditionalTypirServices.type.js";
import { ELangSpecifics } from "../../ELangSpecifics.interface.js";
import { MeasurementType } from "./Measurement.type.js";

export function measurementFactory(typir: ElangTypirServices) {
  return new CustomKind<MeasurementType, ELangSpecifics>(typir, {
    name: "Measurement",
    calculateTypeName: (properties) =>
      `Measurement:${properties.unit.longName ?? properties.unit.name}`,
    calculateTypeUserRepresentation: (properties) =>
      `(measurement) ${properties.unit.name}`,
  });
}
