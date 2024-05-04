/**
 * Type describing the combination of the two types of a binary expression
 *
 */

export type BinaryExpressionQuadrant =
  | "LeftNumberRightNumber"
  | "LeftNumberRightString"
  | "LeftNumberRightBoolean"
  | "LeftNumberRightMeasurement"
  | "LeftNumberRightNull"
  | "LeftNumberRightNumber"
  | "LeftStringRightString"
  | "LeftStringRightBoolean"
  | "LeftStringRightMeasurement"
  | "LeftStringRightNumber"
  | "LeftStringRightNull"
  | "LeftBooleanRightNumber"
  | "LeftBooleanRightString"
  | "LeftBooleanRightBoolean"
  | "LeftBooleanRightMeasurement"
  | "LeftBooleanRightNull"
  | "LeftMeasurementRightNumber"
  | "LeftMeasurementRightString"
  | "LeftMeasurementRightBoolean"
  | "LeftMeasurementRightMeasurement"
  | "LeftMeasurementRightNull"
  | "LeftNullRightNumber"
  | "LeftNullRightString"
  | "LeftNullRightBoolean"
  | "LeftNullRightMeasurement"
  | "LeftNullRightNull"
  | "UnrecognisedBinaryCombination";
