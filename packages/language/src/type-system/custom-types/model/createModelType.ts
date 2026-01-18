import { isCustomType, isType } from "typir";
import { isModelDeclaration, isModelExpression, isParameterDeclaration, ModelDeclaration, ModelExpression } from "../../../index.js";
import { ELangTypirServices } from "../../ELangAdditionalTypirServices.type.js";
import { getOrCreateTypeNull } from "../../typir-types/createPrimitives.js";
import { isModelType, ModelType } from "./Model.type.js";

export function createModelType(
  languageNode: ModelDeclaration | ModelExpression,
  typir: ELangTypirServices
) {
  if(isModelDeclaration(languageNode)){
    const modelType = typir.factory.Model.create({
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
        properties: languageNode.parameters.map((property) => {
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


    // if(modelType)
    //   modelType.addListener(type => {
    //     typir.Conversion.markAsConvertible(typir.factory.Primitives.get({ primitiveName: 'null' })!, type, 'IMPLICIT_EXPLICIT');
    //   }, true);

    return modelType;
  } else if(isModelExpression(languageNode)) {
    return typir.factory.Model.create({
      associatedLanguageNode: languageNode,
      properties: {
        name: "Instance",
        parentTypes: [],
        properties: languageNode.members.map((member) => {
          if (member.property && member.value) {
            const propertyType = typir.Inference.inferType(member.value);
            if (isType(propertyType)) {
              return {
                name: member.property,
                type: propertyType,
                isOptional: false,
              };
            }
          }

          return {
            name: member.property,
            type: getOrCreateTypeNull(typir),
            isOptional: false,
          };
        }),
      },
    })
      .inferenceRule({
        languageKey: ModelExpression.$type,
        matching: (node: ModelExpression) => languageNode === node,
      })
      .finish()
      .getTypeFinal();
  } else {
    return {} as ModelType;
  }
}
