import { interruptAndCheck } from "langium";
import { CancellationTokenSource } from "vscode-languageserver";
import {
  ELangProgram,
} from "e-lang-language";
import { RunnerContext, InterpreterContext } from "./RunnerContext.js";
import { Variables } from "./Variables.js";
import { runStatement } from "./runStatement.js";

// A constant used to determine if the program has been running for
// too long and execution needs to be cancelled
export const TIMEOUT_MS = 1000000 * 5;

/**
 * Main function that runs an ELang program. This is called by the interpreter
 * once the program has been parsed and typed as an ELang program
 * @param program An ELang program
 * @param outerContext The context in which this program is running
 */
export async function runProgram(
  program: ELangProgram,
  outerContext: InterpreterContext,
  outerRunnerContext?: RunnerContext
): Promise<void> {
  const cancellationTokenSource = new CancellationTokenSource();
  const cancellationToken = cancellationTokenSource.token;

  const timeout = setTimeout(async () => {
    cancellationTokenSource.cancel();
  }, TIMEOUT_MS);

  const context: RunnerContext = outerRunnerContext ?? {
    variables: new Variables(),
    cancellationToken,
    timeout,
    log: outerContext.log,
    onStart: outerContext.onStart,
  };

  context.variables.enter();

  if (context.onStart) {
    context.onStart();
  }

  // Validation is handled by the caller (Interpreter.eval) or DocumentBuilder
  // We skip explicit typecheckProgram call as it relies on main branch features not present in package

  let end = false;

  if (program.statements)
    for (const statement of program.statements) {
      await interruptAndCheck(context.cancellationToken);

      await runStatement(statement, context, () => {
        end = true;
      });

      if (end) {
        break;
      }
    }

  context.variables.leave();
  clearTimeout(timeout);
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

export function isNull(value: unknown): value is null {
  return value === null;
}
