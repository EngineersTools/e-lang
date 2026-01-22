import { ForStatement } from "e-lang-language";
import { RunnerContext } from "../classes_and_types/Context.js";
import { runExpression } from "./runExpression.js";
import { runStatement, ReturnFunction } from "./runStatement.js";
import { interruptAndCheck } from "langium";

export async function runForStatement(
  statement: ForStatement,
  context: RunnerContext,
  returnFn: ReturnFunction
): Promise<void> {
  const from = await runExpression(statement.from, context);
  const to = await runExpression(statement.to, context);
  const step = statement.step ? await runExpression(statement.step, context) : 1;

  if (typeof from !== 'number' || typeof to !== 'number' || typeof step !== 'number') {
      throw new Error("For loop parameters must be numbers");
  }

  context.variables.enter();
  const counterName = statement.counter.name;
  context.variables.push(counterName, from);

  let current = from;
  while ((step >= 0 && current <= to) || (step < 0 && current >= to)) {
      await interruptAndCheck(context.cancellationToken!);
      context.variables.set(statement, counterName, current);
      await runStatement(statement.block, context, returnFn);
      current += step;
  }
  context.variables.leave();
}
