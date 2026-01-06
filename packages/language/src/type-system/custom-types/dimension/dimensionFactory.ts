import { CustomKind } from "typir";
import { ELangTypirServices } from "../../ELangAdditionalTypirServices.type.js";
import { ELangSpecifics } from "../../ELangSpecifics.interface.js";
import { calculateDimensionTypeAssignability } from "../../utils/calculateDimensionTypeAssignability.js";
import { DimensionCalculator, DimensionVector } from "../../utils/DimensionCalculator.js";
import { DimensionType } from "./Dimension.type.js";

export function dimensionFactory(typir: ELangTypirServices) {
  return new CustomKind<DimensionType, ELangSpecifics>(typir, {
    name: "Dimension",
    calculateTypeName: (properties) => `Dimension:${properties.name}`,
    calculateTypeUserRepresentation: (properties) => {
      const vecStr = DimensionCalculator.toString(properties.vector as DimensionVector);
      return vecStr ? `${properties.name} [${vecStr}]` : properties.name;
    },
    isNewCustomTypeConvertibleToType: (source, target) => {
      return calculateDimensionTypeAssignability(source, target);
    },
  });
}
