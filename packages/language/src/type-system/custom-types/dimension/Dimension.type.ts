import { UnitType } from "../unit/Unit.type.js";

export type BaseDimension = {
  base: string;
  exponent?: number;
};

export type DimensionType = {
  name: string;
  description?: string;
  units: UnitType[];
  base?: BaseDimension[];
};
