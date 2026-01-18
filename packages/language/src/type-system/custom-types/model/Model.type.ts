import { Type } from "typir";

export type ModelType = {
  name: string;
  parentTypes: ModelType[];
  properties: Type[];
};

export type ModelProperty = {
  name: string;
  type: string;
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