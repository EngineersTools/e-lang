import { CustomKind } from "typir";
import { ElangTypirServices } from "../../ELangAdditionalTypirServices.type.js";
import { ELangSpecifics } from "../../ELangSpecifics.interface.js";
import { ModelType } from "./Model.type.js";

export function modelFactory(typir: ElangTypirServices) {
  return new CustomKind<ModelType, ELangSpecifics>(typir, {
    name: "Model",
    calculateTypeName: (properties) => `${properties.name}-Model`,
    calculateTypeUserRepresentation: (properties) =>
      `(model) ${properties.name}`,
  });
}
