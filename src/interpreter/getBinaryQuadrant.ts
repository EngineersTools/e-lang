import { BinaryExpressionQuadrant } from "./BinaryExpressionQuadrant.js";
import {
  isTypeScriptBoolean,
  isMeasurement,
  isTypeScriptNull,
  isTypeScriptNumber,
  isTypeScriptString,
} from "./runProgram.js";

export function getBinaryQuadrant(
  left: unknown,
  right: unknown
): BinaryExpressionQuadrant {
  if (isTypeScriptNumber(left) && isTypeScriptNumber(right)) return "LeftNumberRightNumber";
  if (isTypeScriptNumber(left) && isTypeScriptString(right)) return "LeftNumberRightString";
  if (isTypeScriptNumber(left) && isTypeScriptBoolean(right)) return "LeftNumberRightBoolean";
  if (isTypeScriptNumber(left) && isMeasurement(right))
    return "LeftNumberRightMeasurement";
  if (isTypeScriptNumber(left) && isTypeScriptNull(right)) return "LeftNumberRightNull";

  if (isTypeScriptString(left) && isTypeScriptNumber(right)) return "LeftStringRightNumber";
  if (isTypeScriptString(left) && isTypeScriptString(right)) return "LeftStringRightString";
  if (isTypeScriptString(left) && isTypeScriptBoolean(right)) return "LeftStringRightBoolean";
  if (isTypeScriptString(left) && isMeasurement(right))
    return "LeftStringRightMeasurement";
  if (isTypeScriptString(left) && isTypeScriptNull(right)) return "LeftStringRightNull";

  if (isTypeScriptBoolean(left) && isTypeScriptNumber(right)) return "LeftBooleanRightNumber";
  if (isTypeScriptBoolean(left) && isTypeScriptString(right)) return "LeftBooleanRightString";
  if (isTypeScriptBoolean(left) && isTypeScriptBoolean(right)) return "LeftBooleanRightBoolean";
  if (isTypeScriptBoolean(left) && isMeasurement(right))
    return "LeftBooleanRightMeasurement";
  if (isTypeScriptBoolean(left) && isTypeScriptNull(right)) return "LeftBooleanRightNull";

  if (isMeasurement(left) && isTypeScriptNumber(right))
    return "LeftMeasurementRightNumber";
  if (isMeasurement(left) && isTypeScriptString(right))
    return "LeftMeasurementRightString";
  if (isMeasurement(left) && isTypeScriptBoolean(right))
    return "LeftMeasurementRightBoolean";
  if (isMeasurement(left) && isMeasurement(right))
    return "LeftMeasurementRightMeasurement";
  if (isMeasurement(left) && isTypeScriptNull(right)) return "LeftMeasurementRightNull";

  if (isTypeScriptNull(left) && isTypeScriptNumber(right)) return "LeftNullRightNumber";
  if (isTypeScriptNull(left) && isTypeScriptString(right)) return "LeftNullRightString";
  if (isTypeScriptNull(left) && isTypeScriptBoolean(right)) return "LeftNullRightBoolean";
  if (isTypeScriptNull(left) && isMeasurement(right)) return "LeftNullRightMeasurement";
  if (isTypeScriptNull(left) && isTypeScriptNull(right)) return "LeftNullRightNull";

  return "UnrecognisedBinaryCombination";
}
