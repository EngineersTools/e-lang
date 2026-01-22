import { ConstantDeclaration, MutableDeclaration } from "e-lang-language";
import { RunnerContext } from "../classes_and_types/Context.js";
import { runExpression } from "./runExpression.js";

export async function runVariableDeclaration(
  statement: ConstantDeclaration | MutableDeclaration,
  context: RunnerContext
): Promise<void> {
  const value = statement.value ? await runExpression(statement.value, context) : null;
  context.variables.push(statement.name, value);
}
