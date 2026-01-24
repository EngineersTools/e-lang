import { Expression, isMeasurement, isUnitDeclaration } from "e-lang-language";
import { RunnerContext } from "../classes_and_types/Context.js";
import { runExpression } from "./runExpression.js";

export async function serialiseExpression(
  expression: Expression,
  context: RunnerContext,
): Promise<string> {
  const value = await runExpression(expression, context);

  if (isMeasurement(expression) && isUnitDeclaration(value.unit)) {
    return `${value.value} ~${value.unit.name}`;
  }

  if (value === null || value === undefined) {
    return "null";
  } else if (Array.isArray(value)) {
    return `[${value.map((v) => (v === null || v === undefined ? "null" : v.toString())).join(", ")}]`;
  } else if (typeof value === "object") {
    const entries = Object.entries(value).map(
      ([key, val]) =>
        `${key}: ${val === null || val === undefined ? "null" : val.toString()}`,
    );
    return `{ ${entries.join(", ")} }`;
  }

  return value.toString();
}
