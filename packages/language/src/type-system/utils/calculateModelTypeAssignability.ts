import { ConversionMode, CustomType, isCustomType, Type, TypeReference } from "typir";
import { isModelType, ModelType } from "../custom-types/model/Model.type.js";
import { ELangTypirServices } from "../ELangAdditionalTypirServices.type.js";
import { ELangSpecifics } from "../ELangSpecifics.interface.js";

export function calculateModelTypeAssignability(
  source: CustomType<ModelType, ELangSpecifics>,
  target: Type,
  typir: ELangTypirServices
): ConversionMode {
  const instanceModel = source.getName().includes("Instance") ? source : target;
  const declaredModel = source.getName().includes("Instance") ? target : source;

  if (
    !isCustomType(instanceModel, "Model") 
    || !isCustomType(declaredModel, "Model")
    || !isModelType(instanceModel.properties)
    || !isModelType(declaredModel.properties)
  ) {
    return "NONE";
  }

  const instancePropertyTypes = instanceModel.properties.properties.map(p => [p.name, isTypirTypeReference(p.type) ? p.type.getType() : p.type]).filter(p => p !== undefined && p[1] !== undefined);

  const declaredPropertyTypes = declaredModel.properties.properties.map(p => [p.name, isTypirTypeReference(p.type) ? p.type.getType() : p.type]).filter(p => p !== undefined && p[1] !== undefined && !p[1].isOptional);

  const declaredModelParentPropertyTypes = declaredModel.properties.parentTypes?.flatMap(p => p.properties.map(p => [p.name, isTypirTypeReference(p.type) ? p.type.getType() : p.type]).filter(p => p !== undefined && p[1] !== undefined && !p[1].isOptional));

  if(instancePropertyTypes.length < declaredPropertyTypes.length) {
    return "NONE";
  }

  for(const declaredProperty of declaredPropertyTypes){
    const instanceProperty = instancePropertyTypes.find(p => p[0] === declaredProperty[0]);
    if(!instanceProperty || !typir.Assignability.isAssignable(instanceProperty[1], declaredProperty[1])) {
      return "NONE";
    }
  }

  if(declaredModelParentPropertyTypes){
    for(const declaredProperty of declaredModelParentPropertyTypes){
      const instanceProperty = instancePropertyTypes.find(p => p[0] === declaredProperty[0]);
      if(!instanceProperty || !typir.Assignability.isAssignable(instanceProperty[1], declaredProperty[1])) {
        return "NONE";
      }
    }
  }

  return "EXPLICIT";
}

function isTypirTypeReference(type: unknown): type is TypeReference<any, ELangSpecifics> {
  return typeof type === "object" && type !== null && "resolvedType" in type;
}