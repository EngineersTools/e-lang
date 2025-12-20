import { CustomKind } from "typir";
import { ElangTypirServices } from "../../ELangAdditionalTypirServices.type.js";
import { ELangSpecifics } from "../../ELangSpecifics.interface.js";
import { UnitType } from "./Unit.type.js";

export function unitFactory(typir: ElangTypirServices) {
  return new CustomKind<UnitType, ELangSpecifics>(typir, {
    name: "Unit",
    calculateTypeName: (properties) => properties.name,
    calculateTypeUserRepresentation: (properties) => {
        // Convert vector to string representation
        const vecStr = Array.from(properties.vector.entries())
            .map(([k, v]) => `${k}^${v}`)
            .join('*');
        return vecStr ? `${properties.name} (${vecStr})` : properties.name;
    }
  });
}
