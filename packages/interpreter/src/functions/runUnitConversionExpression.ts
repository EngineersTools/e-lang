import {
  BinaryExpression,
  isReferenceExpression,
  isUnitDeclaration,
  ConversionCalculator
} from "e-lang-language";
import { AstNodeError } from "../classes_and_types/AstNodeError.js";
import { RunnerContext } from "../classes_and_types/Context.js";
import { runExpression } from "./runExpression.js";

export async function runUnitConversionExpression(
  expr: BinaryExpression,
  context: RunnerContext,
): Promise<any> {
  if (
    !isReferenceExpression(expr.right) ||
    !isUnitDeclaration(expr.right.element.ref)
  ) {
    throw new AstNodeError(expr, "Invalid unit conversion expression: Right hand side must be a unit reference");
  }

  const left = await runExpression(expr.left, context);
  if (typeof left !== "number") {
    throw new AstNodeError(expr, "Type Error: Unit conversion requires a number on the left hand side");
  }

  const right = expr.right.element.ref;
  const calculator = new ConversionCalculator();
  const factor = calculator.compute(right);

  return left / factor;
}
