import { CustomKind } from "typir";
import { ELangTypirServices } from "../../ELangAdditionalTypirServices.type.js";
import { ELangSpecifics } from "../../ELangSpecifics.interface.js";
import { calculateDimensionTypeAssignability } from "../../utils/calculateDimensionTypeAssignability.js";
import { DimensionCalculator, DimensionVector } from "../../utils/DimensionCalculator.js";
import { UnitType } from "./Unit.type.js";

export function unitFactory(typir: ELangTypirServices) {
  return new CustomKind<UnitType, ELangSpecifics>(typir, {
    name: "Unit",
    calculateTypeName: (properties) => {
      const vecStr = DimensionCalculator.toString(properties.vector as DimensionVector);
      return vecStr ? `Unit:${properties.name}_[${vecStr}]` : `Unit:${properties.name}`
    },
    calculateTypeUserRepresentation: (properties) => {
      const vecStr = DimensionCalculator.toString(properties.vector as DimensionVector);
      return vecStr ? `${properties.name} [${vecStr}]` : properties.name;
    },
    isNewCustomTypeConvertibleToType: (source, target) => {
      return calculateDimensionTypeAssignability(source, target);
    },
  });
}

