import { CustomKind } from "typir";
import { TypirLangiumServices } from "typir-langium";
import { ELangSpecifics } from "../../ELangSpecifics.interface.js";
import { Dimension } from "./Dimension.type.js";

export function dimensionFactory(typir: TypirLangiumServices<ELangSpecifics>) {
  return new CustomKind<Dimension, ELangSpecifics>(typir, {
    name: "Dimension",
    calculateTypeName: (properties) => `${properties.name}Dimension`,
  });
}
