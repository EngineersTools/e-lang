import {
  ELangProgram
} from "e-lang-language";
import { interruptAndCheck } from "langium";
import { RunnerContext } from "../classes_and_types/Context.js";
import { Variables } from "../classes_and_types/Variables.js";
import { runStatement } from "./runStatement.js";



/**
 * Executes an ELang program within an interpreter context, managing runtime state,
 * cancellation, and a runtime timeout.
 *
 * The function:
 * - Creates a CancellationTokenSource and enforces a global timeout (TIMEOUT_MS).
 * - Merges or inherits runner context from an optional outerRunnerContext (variables,
 *   cancellationToken, timeout).
 * - Enters a new variable scope for the program and leaves it when execution completes.
 * - Calls the interpreter context's onStart callback if provided.
 * - Iterates program.statements, checking for cancellation before each statement via
 *   interruptAndCheck, and executes each statement with runStatement. Statement
 *   execution may request an early stop by invoking the provided end callback.
 * - Clears the timeout and disposes/returns variable scope when finished.
 *
 * Note: Cancellation may be triggered either by the timeout or by an external token
 * supplied via outerRunnerContext.cancellationToken.
 *
 * @param program - The parsed ELangProgram AST to execute.
 * @param context - Runner-level context providing variables, cancellation token,
 *                  timeout, logging, and lifecycle hooks.
 * @returns A Promise that resolves when program execution finishes or is cancelled.
 * @throws If execution is interrupted or a statement/utility throws, the rejection
 *         propagates to the caller.
 */
export async function runProgram(
  program: ELangProgram,
  context: RunnerContext,
): Promise<Variables> {

  context.variables.enter();

  if (context.onStart) {
    context.onStart();
  }

  let end = false;

  if (program.statements)
    for (const statement of program.statements) {
      await interruptAndCheck(context.cancellationToken!);

      await runStatement(statement, context, () => {
        end = true;
      });

      if (end) {
        break;
      }
    }

  clearTimeout(context.timeout);

  return context.variables;
}


