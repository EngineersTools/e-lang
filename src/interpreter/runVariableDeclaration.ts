import { interruptAndCheck } from "langium";
import {
  ConstantDeclaration,
  MutableDeclaration,
  NullLiteral,
  isExpression,
  isLambdaDeclaration,
} from "../language/generated/ast.js";
import { RunnerContext } from "./RunnerContext.js";
import { runExpression } from "./runExpression.js";

export async function runVariableDeclaration(
  statement: ConstantDeclaration | MutableDeclaration,
  context: RunnerContext
): Promise<void> {
  await interruptAndCheck(context.cancellationToken);

  if (statement.assignment && statement.value) {
    if (isExpression(statement.value)) {
      const value = statement.value
        ? await runExpression(statement.value, context)
        : null;

      context.variables.push(statement.name, value);
    } else if (isLambdaDeclaration(statement.value)) {
    }
  } else {
    // The variable hasn't been assigned a value when declared
    // In ELang, any variable that doesn't have a value
    // is assigned the value of null
    context.variables.push(statement.name, NullLiteral);
  }
}
