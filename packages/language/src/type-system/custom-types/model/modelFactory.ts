import { CustomKind } from "typir";
import { TypirLangiumServices } from "typir-langium";
import { ELangSpecifics } from "../../ELangSpecifics.interface.js";
import { ModelType } from "./Model.type.js";

export function modelFactory(typir: TypirLangiumServices<ELangSpecifics>) {
  return new CustomKind<ModelType, ELangSpecifics>(typir, {
    name: "Model",
    calculateTypeName: (properties) => `${properties.name}Model`,
    calculateTypeUserRepresentation: (properties) =>
      `(model) ${properties.name}`,
  });
}
