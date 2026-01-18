import { isCustomType, isType } from "typir";
import { isModelDeclaration, isParameterDeclaration, ModelDeclaration } from "../../../index.js";
import { ELangTypirServices } from "../../ELangAdditionalTypirServices.type.js";
import { isModelType } from "./Model.type.js";

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

        throw new Error(
          `Invalid parent type reference in model '${languageNode.name}'.`
        );
      }),
      properties: languageNode.properties.map((property) => {
        if (isParameterDeclaration(property)){
          const propertyType = typir.Inference.inferType(property);
          if(isType(propertyType)){
            return propertyType;
          }
        }

        throw new Error(
          `Invalid property type reference in model '${languageNode.name}'.`
        );
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
