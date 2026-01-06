import { CustomKind } from "typir";
import { ELangTypirServices } from "../../ELangAdditionalTypirServices.type.js";
import { ELangSpecifics } from "../../ELangSpecifics.interface.js";
import { calculateTypeAssignability } from "../../utils/calculateTypeAssignability.js";
import { UnitType } from "./Unit.type.js";

export function unitFactory(typir: ELangTypirServices) {
  return new CustomKind<UnitType, ELangSpecifics>(typir, {
    name: "Unit",
    calculateTypeName: (properties) => `Unit:${properties.name}`,
    calculateTypeUserRepresentation: (properties) => {
      // Convert vector to string representation
      const vecStr = Array.from(properties.vector.entries())
        .map(([k, v]) => `${k}^${v}`)
        .join("*");
      return vecStr ? `${properties.name} [${vecStr}]` : properties.name;
    },
    isNewCustomTypeConvertibleToType: (source, target) => {
      return calculateTypeAssignability(source, target);
    },
  });
}
