import { isCustomType, isType } from "typir";
import { isModelDeclaration, isParameterDeclaration, ModelDeclaration } from "../../../index.js";
import { ELangTypirServices } from "../../ELangAdditionalTypirServices.type.js";
import { getOrCreateTypeNull } from "../../typir-types/createPrimitives.js";
import { isModelType, ModelType } from "./Model.type.js";

export function createModelType(
  languageNode: ModelDeclaration,
  typir: ELangTypirServices
) {
  return typir.factory.Model.create({
    associatedLanguageNode: languageNode,
    properties: {
      name: languageNode.name,
      parentTypes: languageNode.parentTypes.map((modelDeclararion) => {
        if (isModelDeclaration(modelDeclararion.ref)){
          const parentModelType = typir.Inference.inferType(modelDeclararion.ref);
          if(isCustomType(parentModelType, "Model") && isModelType(parentModelType.properties)){
            return parentModelType.properties;
          }
        }

        return {} as ModelType;
      }),
      properties: languageNode.properties.map((property) => {
        if (isParameterDeclaration(property)) {
          const propertyType = typir.Inference.inferType(property);
          if (isType(propertyType)) {
            return {
              name: property.name,
              type: propertyType,
              isOptional: property.isOptional,
            };
          }
        }

        return {
          name: property.name,
          type: getOrCreateTypeNull(typir),
          isOptional: property.isOptional,
        };
      }),
    },
  })
    .inferenceRule({
      languageKey: ModelDeclaration.$type,
      matching: (node: ModelDeclaration) => languageNode === node,
    })
    .finish()
    .getTypeFinal();
}
