import {
  Expression,
  isConstantDeclaration,
  isMeasurement,
  isMutableDeclaration,
  isReferenceExpression,
} from "e-lang-language";
import { RunnerContext } from "../classes_and_types/Context.js";
import { runExpression } from "./runExpression.js";
import { MeasurementNumber } from "../classes_and_types/MeasurementNumber.js";
import { ComplexNumber } from "../classes_and_types/ComplexNumber.js";

export function serialiseValue(
  value: any,
  seen: WeakSet<any> = new WeakSet(),
): string {
  if (value === null || value === undefined) {
    return "null";
  }

  if (typeof value === "string") {
    return `"${value}"`;
  }

  if (typeof value !== "object") {
    return String(value);
  }

  if (seen.has(value)) {
    return "[Circular]";
  }
  seen.add(value);

  if (Array.isArray(value)) {
    const items = value.map((v) => serialiseValue(v, seen));
    return `[${items.join(", ")}]`;
  }

  const entries = Object.entries(value)
    // Avoid serializing Langium's internal circular references
    .filter(
      ([key]) =>
        key !== "$container" && key !== "$document" && key !== "$cstNode",
    )
    .map(([key, val]) => `${key}: ${serialiseValue(val, seen)}`);

  return `{ ${entries.join(", ")} }`;
}

export async function serialiseExpression(
  expression: Expression,
  context: RunnerContext,
): Promise<string> {
  try {
    const value = await runExpression(expression, context);

    if (isReferenceExpression(expression)) {
      if (
        (isConstantDeclaration(expression.element.ref) ||
          isMutableDeclaration(expression.element.ref)) &&
        expression.element.ref.value
      ) {
        return serialiseExpression(expression.element.ref.value, context);
      }
      return "unknown";
    }

    if (value instanceof ComplexNumber) {
      return `${value}`;
    }

    if (isMeasurement(expression) || value instanceof MeasurementNumber) {
      return `${value}`;
    }

    if (value === null || value === undefined) {
      return "null";
    }

    if (typeof value === "string") {
      return value;
    }

    return serialiseValue(value);
  } catch (error) {
    return `[Error formatting output: ${error instanceof Error ? error.message : String(error)}]`;
  }
}
