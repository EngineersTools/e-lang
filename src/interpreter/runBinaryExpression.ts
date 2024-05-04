import {
  BinaryExpression,
  MeasurementLiteral,
} from "../language/generated/ast.js";
import { AstNodeError } from "./AstNodeError.js";
import { RunnerContext } from "./RunnerContext.js";
import { applyOperator } from "./applyOperator.js";
import { checkUnitCompatibility } from "./checkUnitCompatibility.js";
import { getBinaryQuadrant } from "./getBinaryQuadrant.js";
import { runExpression } from "./runExpression.js";
import { isBoolean, isMeasurement, isNumber, isString } from "./runProgram.js";
import { setExpressionValue } from "./setExpressionValue.js";

export async function runBinaryExpression(
  expression: BinaryExpression,
  context: RunnerContext
): Promise<unknown> {
  const { left, right, operator } = expression;

  // Get the value of the right expression
  const rightValue = await runExpression(right, context);
  // If this is an assignment, set the value accordingly
  if (operator === "=") {
    return await setExpressionValue(left, rightValue, context);
  }
  // Get the value of the right expression
  const leftValue = await runExpression(left, context);

  // If both sides are measurements
  // Check for unit compatibility
  if (
    getBinaryQuadrant(leftValue, rightValue) ==
    "LeftMeasurementRightMeasurement"
  ) {
    checkUnitCompatibility(
      leftValue as MeasurementLiteral,
      rightValue as MeasurementLiteral
    );
  }

  if (operator === "+") {
    return await applyOperator(
      expression,
      operator,
      leftValue,
      rightValue,
      context,
      (e) => isString(e) || isNumber(e) || isMeasurement(e)
    );
  } else if (["-", "*", "^", "/", "<", "<=", ">", ">="].includes(operator)) {
    return await applyOperator(
      expression,
      operator,
      leftValue,
      rightValue,
      context,
      (e) => isNumber(e) || isMeasurement(e)
    );
  } else if (["and", "or"].includes(operator)) {
    return await applyOperator(
      expression,
      operator,
      leftValue,
      rightValue,
      context,
      (e) => isBoolean(e)
    );
  } else if (["==", "!="].includes(operator)) {
    return await applyOperator(
      expression,
      operator,
      leftValue,
      rightValue,
      context
    );
  }

  throw new AstNodeError(expression, "Invalid binary expression.");
}
