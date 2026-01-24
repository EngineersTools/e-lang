import {
  BinaryExpression,
  isMeasurement,
  isReferenceExpression,
  isUnitDeclaration,
} from "e-lang-language";
import { RunnerContext } from "../classes_and_types/Context.js";
import { runExpression } from "./runExpression.js";

export async function runUnitConversionExpression(
  expr: BinaryExpression,
  context: RunnerContext,
): Promise<any> {
  if (
    !isMeasurement(expr.left) ||
    !isReferenceExpression(expr.right) ||
    !isUnitDeclaration(expr.right.element.ref)
  ) {
    throw new Error("Invalid unit conversion expression");
  }

  // Left should be a measurement value
  const left = await runExpression(expr.left, context);

  // Right should be a unit reference
  const right = expr.right.element.ref;

  // Perform unit conversion logic here
  // This is a placeholder for the actual conversion logic
  return { value: left.value, unit: right.name  };
}
