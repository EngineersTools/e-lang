import { CustomKind } from "typir";
import { TypirLangiumServices } from "typir-langium";
import { ELangSpecifics } from "../../ELangSpecifics.interface.js";
import { MeasurementType } from "./Measurement.type.js";

export function measurementFactory(
  typir: TypirLangiumServices<ELangSpecifics>
) {
  return new CustomKind<MeasurementType, ELangSpecifics>(typir, {
    name: "Measurement",
    // calculateTypeName: (properties) => `${properties.name}Measurement`,
    // calculateTypeUserRepresentation: (properties) =>
    //   `(measurement) ${
    //     properties.longName !== "" ? properties.longName : properties.name
    //   }${properties.description !== "" ? ` '${properties.description}'` : ""}`,
  });
}
