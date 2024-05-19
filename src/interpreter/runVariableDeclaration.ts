import { interruptAndCheck } from "langium";
import {
    ConstantDeclaration,
    MutableDeclaration
} from "../language/generated/ast.js";
import { isAssignable } from "../language/type-system/assignment.js";
import { inferType } from "../language/type-system/infer.js";
import { AstNodeError } from "./AstNodeError.js";
import { RunnerContext } from "./RunnerContext.js";
import { runExpression } from "./runExpression.js";

export async function runVariableDeclaration(
  statement: ConstantDeclaration | MutableDeclaration,
  context: RunnerContext
): Promise<void> {
  await interruptAndCheck(context.cancellationToken);

  if (statement.assignment && statement.value) {
    const type = inferType(statement, context.types);
    const valueType = inferType(statement.value, context.types);

    context.types.setVariableType(statement.name, type);

    if (!isAssignable(type, valueType)) {
      throw new AstNodeError(
        statement,
        "Invalid types between variable and its assigned value."
      );
    }

    const value = statement.value
      ? await runExpression(statement.value, context)
      : null;

    context.variables.push(statement.name, value);
  } else {
    // The variable hasn't been assigned a value when declared
    // In Elang, any variable that doesn't have a value
    // is assigned the value of null
    context.variables.push(statement.name, null);
  }
}
