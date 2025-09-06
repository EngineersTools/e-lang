import { CustomKind } from "typir";
import { ElangTypirServices } from "../../ELangAdditionalTypirServices.type.js";
import { ELangSpecifics } from "../../ELangSpecifics.interface.js";
import { UnitType } from "./Unit.type.js";

export function unitFactory(typir: ElangTypirServices) {
  return new CustomKind<UnitType, ELangSpecifics>(typir, {
    name: "Unit",
    calculateTypeName: (properties) =>
      `Unit:${properties.longName ?? properties.name}`,
    calculateTypeUserRepresentation: (properties) =>
      `(unit) ${
        properties.longName !== "" ? properties.longName : properties.name
      }${properties.description !== "" ? ` '${properties.description}'` : ""}`,
  });
}
