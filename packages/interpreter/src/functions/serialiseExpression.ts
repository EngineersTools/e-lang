import { Expression, isMeasurement, isUnitDeclaration } from "e-lang-language";
import { RunnerContext } from "../classes_and_types/Context.js";
import { runExpression } from "./runExpression.js";

export function serialiseValue(value: any, seen: WeakSet<any> = new WeakSet()): string {
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
    .filter(([key]) => key !== "$container" && key !== "$document" && key !== "$cstNode")
    .map(([key, val]) => `${key}: ${serialiseValue(val, seen)}`);

  return `{ ${entries.join(", ")} }`;
}

export async function serialiseExpression(
  expression: Expression,
  context: RunnerContext,
): Promise<string> {
  try {
    const value = await runExpression(expression, context);

    if (isMeasurement(expression) && value && typeof value === 'object' && 'unit' in value && isUnitDeclaration(value.unit)) {
      return `${value.value} ~${value.unit.name}`;
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
