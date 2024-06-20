import { RunnerContext } from "./interpreter/RunnerContext.js";
import {
    ReturnFunction,
    runElangStatement,
} from "./interpreter/runElangStatement.js";
import { runExpression } from "./interpreter/runExpression.js";
import { ForStatement } from "./language/generated/ast.js";

export async function runForStatement(
  forStmt: ForStatement,
  context: RunnerContext,
  returnFn: ReturnFunction
): Promise<void> {
  const { counter, from, to, step, block } = forStmt;
  context.variables.enter();
  context.types.enterScope();

  if (counter) {
    await runElangStatement(counter, context, returnFn);
  }

  const calcStep = step ? Number(await runExpression(step, context)) : 1;

  for (
    let i = Number(await runExpression(from, context));
    i < Number(await runExpression(to, context));
    i = i + calcStep
  ) {
    context.variables.set(counter, counter.name, i);
    await runElangStatement(block, context, returnFn);
  }

  context.variables.leave();
  context.types.leaveScope();
}
