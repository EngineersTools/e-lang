export type ModelType = {
  name: string;
  parentTypes: ModelType[];
  properties: ModelProperty[];
};

export type ModelProperty = {
  name: string;
  type: string;
  isOptional: boolean;
};
