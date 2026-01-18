import { Type } from "typir";

export type ModelType = {
  name: string;
  parentTypes: ModelType[];
  properties: ModelProperty[];
};

export type ModelProperty = {
  name: string;
  type: Type;
  isOptional: boolean;
};

export function isModelType(type: unknown): type is ModelType {
  return (
    typeof type === "object" &&
    type !== null &&
    "name" in type &&
    "parentTypes" in type &&
    "properties" in type
  );
}

export function isModelProperty(property: unknown): property is ModelProperty {
  return (
    typeof property === "object" &&
    property !== null &&
    "name" in property &&
    "type" in property &&
    "isOptional" in property
  );
}