import { BinaryExpressionQuadrant } from "./BinaryExpressionQuadrant.js";
import {
  isBoolean,
  isMeasurement,
  isNull,
  isNumber,
  isString,
} from "./runProgram.js";

export function getBinaryQuadrant(
  left: unknown,
  right: unknown
): BinaryExpressionQuadrant {
  if (isNumber(left) && isNumber(right)) return "LeftNumberRightNumber";
  if (isNumber(left) && isString(right)) return "LeftNumberRightString";
  if (isNumber(left) && isBoolean(right)) return "LeftNumberRightBoolean";
  if (isNumber(left) && isMeasurement(right))
    return "LeftNumberRightMeasurement";
  if (isNumber(left) && isNull(right)) return "LeftNumberRightNull";

  if (isString(left) && isNumber(right)) return "LeftStringRightNumber";
  if (isString(left) && isString(right)) return "LeftStringRightString";
  if (isString(left) && isBoolean(right)) return "LeftStringRightBoolean";
  if (isString(left) && isMeasurement(right))
    return "LeftStringRightMeasurement";
  if (isString(left) && isNull(right)) return "LeftStringRightNull";

  if (isBoolean(left) && isNumber(right)) return "LeftBooleanRightNumber";
  if (isBoolean(left) && isString(right)) return "LeftBooleanRightString";
  if (isBoolean(left) && isBoolean(right)) return "LeftBooleanRightBoolean";
  if (isBoolean(left) && isMeasurement(right))
    return "LeftBooleanRightMeasurement";
  if (isBoolean(left) && isNull(right)) return "LeftBooleanRightNull";

  if (isMeasurement(left) && isNumber(right))
    return "LeftMeasurementRightNumber";
  if (isMeasurement(left) && isString(right))
    return "LeftMeasurementRightString";
  if (isMeasurement(left) && isBoolean(right))
    return "LeftMeasurementRightBoolean";
  if (isMeasurement(left) && isMeasurement(right))
    return "LeftMeasurementRightMeasurement";
  if (isMeasurement(left) && isNull(right)) return "LeftMeasurementRightNull";

  if (isNull(left) && isNumber(right)) return "LeftNullRightNumber";
  if (isNull(left) && isString(right)) return "LeftNullRightString";
  if (isNull(left) && isBoolean(right)) return "LeftNullRightBoolean";
  if (isNull(left) && isMeasurement(right)) return "LeftNullRightMeasurement";
  if (isNull(left) && isNull(right)) return "LeftNullRightNull";

  return "UnrecognisedBinaryCombination";
}
