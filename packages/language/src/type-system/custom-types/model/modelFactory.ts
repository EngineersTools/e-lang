import { CustomKind } from "typir";
import { ELangTypirServices } from "../../ELangAdditionalTypirServices.type.js";
import { ELangSpecifics } from "../../ELangSpecifics.interface.js";
import { calculateModelTypeAssignability } from "../../utils/calculateModelTypeAssignability.js";
import { ModelType } from "./Model.type.js";

export function modelFactory(typir: ELangTypirServices) {
  return new CustomKind<ModelType, ELangSpecifics>(typir, {
    name: "Model",
    calculateTypeName: (properties) => `${properties.name}-Model`,
    calculateTypeUserRepresentation: (properties) =>
      `(model) ${properties.name}`,
    isNewCustomTypeConvertibleToType: (source, target) => {
      return calculateModelTypeAssignability(source, target, typir);
    },
  });
}