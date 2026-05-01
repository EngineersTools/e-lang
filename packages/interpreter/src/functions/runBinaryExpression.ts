import { BinaryExpression } from "e-lang-language";
import { AstNodeError } from "../classes_and_types/AstNodeError.js";
import { RunnerContext } from "../classes_and_types/Context.js";
import { runExpression } from "./runExpression.js";
import { runUnitConversionExpression } from "./runUnitConversionExpression.js";

export async function runBinaryExpression(
  expr: BinaryExpression,
  context: RunnerContext,
): Promise<any> {
  const left = await runExpression(expr.left, context);
  const right = await runExpression(expr.right, context);

  switch (expr.operator) {
    case "+":
      if (typeof left === "number" && typeof right === "number") {
        return left + right;
      } else if (typeof left === "string" && typeof right === "string") {
        return left + right;
      }

      throw new AstNodeError(
        expr,
        `Type Error: Cannot apply operator '+' to types ${typeof left} and ${typeof right}`,
      );
    case "-":
      if (typeof left !== "number" || typeof right !== "number")
        throw new AstNodeError(
          expr,
          "Type Error: '-' requires number operands",
        );
      return left - right;
    case "*":
      if (typeof left !== "number" || typeof right !== "number")
        throw new AstNodeError(
          expr,
          "Type Error: '*' requires number operands",
        );
      return left * right;
    case "/":
      if (typeof left !== "number" || typeof right !== "number")
        throw new AstNodeError(
          expr,
          "Type Error: '/' requires number operands",
        );
      return left / right;
    case "^":
      if (typeof left !== "number" || typeof right !== "number")
        throw new AstNodeError(
          expr,
          "Type Error: '^' requires number operands",
        );
      return Math.pow(left, right);
    case "==":
      return left === right;
    case "!=":
      return left !== right;
    case "<":
      if (typeof left !== "number" || typeof right !== "number")
        throw new AstNodeError(
          expr,
          "Type Error: '<' requires number operands",
        );
      return left < right;
    case "<=":
      if (typeof left !== "number" || typeof right !== "number")
        throw new AstNodeError(
          expr,
          "Type Error: '<=' requires number operands",
        );
      return left <= right;
    case ">":
      if (typeof left !== "number" || typeof right !== "number")
        throw new AstNodeError(
          expr,
          "Type Error: '>' requires number operands",
        );
      return left > right;
    case ">=":
      if (typeof left !== "number" || typeof right !== "number")
        throw new AstNodeError(
          expr,
          "Type Error: '>=' requires number operands",
        );
      return left >= right;
    case "and":
      if (typeof left !== "boolean" || typeof right !== "boolean")
        throw new AstNodeError(
          expr,
          "Type Error: 'and' requires boolean operands",
        );
      return left && right;
    case "or":
      if (typeof left !== "boolean" || typeof right !== "boolean")
        throw new AstNodeError(
          expr,
          "Type Error: 'or' requires boolean operands",
        );
      return left || right;
    case "equal":
      return left === right;
    case "not_equal":
      return left !== right;
    case "->":
      return await runUnitConversionExpression(expr, context);
    case "=":
      // Assignment is handled here? In main branch runExpression might handle assignment or runBinaryExpression.
      // In current interpreter.ts it was in evaluateExpression for '=' check specifically.
      // If we put it here, we need to know if we are assigning.
      // But runExpression passed values. We can't assign to a value.
      // We need to handle assignment in runExpression before calling runBinaryExpression OR
      // pass expr and handle it here (which we do).
      // But left is already evaluated!
      // Wait, runBinaryExpression takes expr. But I called runExpression(left) at top.
      // That's wrong for assignment.
      // I should handle assignment separately in runExpression or handle it here with checks.
      throw new AstNodeError(
        expr,
        "Assignment '=' should be handled in runExpression",
      );
    default:
      throw new AstNodeError(expr, `Unknown operator: ${expr.operator}`);
  }
}
