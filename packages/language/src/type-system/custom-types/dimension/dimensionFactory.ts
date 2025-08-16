import { CustomKind } from "typir";
import { TypirLangiumServices } from "typir-langium";
import { ELangSpecifics } from "../../ELangSpecifics.interface.js";
import { DimensionType } from "./Dimension.type.js";

export function dimensionFactory(typir: TypirLangiumServices<ELangSpecifics>) {
  return new CustomKind<DimensionType, ELangSpecifics>(typir, {
    name: "Dimension",
    calculateTypeName: (properties) => `${properties.name}Dimension`,
  });
}
