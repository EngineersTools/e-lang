import { DimensionVector } from "../../utils/DimensionCalculator.js";

export type DimensionType = {
  name: string;
    vector: DimensionVector;
};

export function isDimensionType(type: unknown): type is DimensionType {
  if (typeof type !== 'object' || type === null) {
    return false;
  }

  const dimType = type as DimensionType;

  return (
    typeof dimType.name === 'string' &&
    dimType.vector instanceof Map
  );
}