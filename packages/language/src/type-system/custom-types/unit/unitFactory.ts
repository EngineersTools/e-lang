import { CustomKind } from "typir";
import { TypirLangiumServices } from "typir-langium";
import { ELangSpecifics } from "../../ELangSpecifics.interface.js";
import { UnitType } from "./Unit.type.js";

export function unitFactory(typir: TypirLangiumServices<ELangSpecifics>) {
  return new CustomKind<UnitType, ELangSpecifics>(typir, {
    name: "Unit",
    calculateTypeName: (properties) => `${properties.name}Unit`,
  });
}
