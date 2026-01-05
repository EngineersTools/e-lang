import { DimensionVector } from "../../utils/dimension-calculator.js";

export type UnitType = {
  name: string;
  vector: DimensionVector;
};

export function isUnitType(type: unknown): type is UnitType {
  if (typeof type !== 'object' || type === null) {
    return false;
  }

  const unitType = type as UnitType;

  return (
    typeof unitType.name === 'string' &&
    unitType.vector instanceof Map
  );
}