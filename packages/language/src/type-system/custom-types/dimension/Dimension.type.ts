import { UnitType } from "../unit/Unit.type.js";

export type DimensionType = {
  name: string;
  description?: string;
  units: UnitType[];
};
