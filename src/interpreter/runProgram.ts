import { interruptAndCheck, ValidationAcceptor } from "langium";
import { CancellationTokenSource } from "vscode-languageserver";
import {
  ELangProgram,
  isMeasurementLiteral,
  MeasurementLiteral,
} from "../language/generated/ast.js";
import { RunnerContext } from "./RunnerContext.js";
import { Variables } from "./Variables.js";
import { InterpreterContext, services } from "./interpreter.js";
import { runELangStatement } from "./runELangStatement.js";

// A constant used to determine if the program has been running for
// too long and execution needs to be cancelled
export const TIMEOUT_MS = 1000 * 5;

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
  // Create a Cancellation Token. A cancellation token is passed to an asynchronous
  // or long running operation to request cancellation, like cancelling a request
  // for completion items because the user continued to type.
  const cancellationTokenSource = new CancellationTokenSource();
  const cancellationToken = cancellationTokenSource.token;

  // If the program takes longer than the set TIMEOUT to run, issue a
  // cancel() request to stop the execution
  const timeout = setTimeout(async () => {
    cancellationTokenSource.cancel();
  }, TIMEOUT_MS);

  // Create a context for the run of this program
  const context: RunnerContext = outerRunnerContext ?? {
    variables: new Variables(),
    cancellationToken,
    timeout,
    // Pass the context and onStart function
    // from the interpreter in which this program is running
    log: outerContext.log,
    onStart: outerContext.onStart,
  };

  // Initialise the Variables and Types objects of this program
  context.variables.enter();

  // If an onStart function was passed, run it now
  if (context.onStart) {
    context.onStart();
  }

  // Typecheck the program
  const validator: ValidationAcceptor = (severity, message, info) => {
    const range = info.node.$cstNode?.range;

    if (severity === "error") {
      throw new Error(
        `[Ln ${range?.end.line}, Col ${range?.end.character}] - ${message}`
      );
    } else {
      context.log(
        `${severity}: [Ln ${range?.end.line}, Col ${range?.end.character}] - ${message}`
      );
    }
  };

  services.ELang.validation.ELangValidator.typecheckProgram(program, validator);

  // If the program contains statements, run through
  // them in sequence
  let end = false;

  if (program.statements)
    for (const statement of program.statements) {
      // Check if the program needs to be interrupted before
      // executing each statement
      await interruptAndCheck(context.cancellationToken);

      // Run the ELangStatement passing the current running context
      await runELangStatement(statement, context, () => {
        end = true;
      });

      if (end) {
        break;
      }
    }

  // Close and finalise the Variables and Types objects for this run
  context.variables.leave();
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

export function isMeasurement(value: unknown): value is MeasurementLiteral {
  return isMeasurementLiteral(value);
}
