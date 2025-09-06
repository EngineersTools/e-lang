import { CustomKind } from "typir";
import { ElangTypirServices } from "../../ELangAdditionalTypirServices.type.js";
import { ELangSpecifics } from "../../ELangSpecifics.interface.js";
import { DimensionType } from "./Dimension.type.js";

export function dimensionFactory(typir: ElangTypirServices) {
  return new CustomKind<DimensionType, ELangSpecifics>(typir, {
    name: "Dimension",
    calculateTypeName: (properties) => `Dimension:${properties.name}`,
    calculateTypeUserRepresentation: (properties) =>
      `(dimension) ${properties.name}`,
  });
}
