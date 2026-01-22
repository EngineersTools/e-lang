import { Expression } from "e-lang-language";
import { RunnerContext } from "../classes_and_types/Context.js";
import { runExpression } from "./runExpression.js";

export async function serialiseExpression(
  expression: Expression,
  context: RunnerContext
): Promise<string> {
  const value = await runExpression(expression, context);

  if (value === null || value === undefined) return "null";
  else if (typeof value === "object") return JSON.stringify(value);

  return String(value);
}
