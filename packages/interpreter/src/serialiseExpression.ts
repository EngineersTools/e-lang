import { Expression } from "e-lang-language";
import { RunnerContext } from "./RunnerContext.js";
import { runExpression } from "./runExpression.js";

export async function serialiseExpression(
  expression: Expression,
  context: RunnerContext
): Promise<string> {
  const value = await runExpression(expression, context);
  if (value === null || value === undefined) return "null";
  return String(value);
}
