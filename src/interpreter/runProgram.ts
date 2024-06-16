import { interruptAndCheck } from "langium";
import { CancellationTokenSource } from "vscode-languageserver";
import { resolveImportUri } from "../language/elang-scope.js";
import {
  ElangProgram,
  MeasurementLiteral,
  isExportable,
  isMeasurementLiteral,
} from "../language/generated/ast.js";
import { TypeEnvironment } from "../language/type-system/TypeEnvironment.class.js";
import { RunnerContext } from "./RunnerContext.js";
import { Variables } from "./Variables.js";
import { InterpreterContext, services } from "./interpreter.js";
import { runElangStatement } from "./runElangStatement.js";

// A constant used to determine if the program has been running for
// too long and execution needs to be cancelled
export const TIMEOUT_MS = 1000 * 5;

/**
 * Main function that runs an Elang program. This is called by the interpreter
 * once the program has been parsed and typed as an Elang program
 * @param program An Elang program
 * @param outerContext The context in which this program is running
 */

export async function runProgram(
  program: ElangProgram,
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
    types: new TypeEnvironment(),
    cancellationToken,
    timeout,
    // Pass the context and onStart function
    // from the interpreter in which this program is running
    log: outerContext.log,
    onStart: outerContext.onStart,
  };

  // Initialise the Variables and Types objects of this program
  context.variables.enter();
  context.types.enterScope();

  // If an onStart function was passed, run it now
  if (context.onStart) {
    context.onStart();
  }

  // Import any files referenced in this program
  if (program.imports) {
    // Get currently active notebook directory
    // All import references will be resolved
    // from this as s base

    // const currentDir
    // const currentDir = UriUtils.dirname(
    //   (vscode.window.activeTextEditor as vscode.TextEditor).document.uri
    // );

    for (const imp of program.imports) {
      let importPath = imp.importSource;
      if (!importPath.endsWith(".el")) {
        importPath += ".el";
      }

      const importUri = resolveImportUri(imp);

      if (importUri) {
        const importedDocument =
          services.shared.workspace.LangiumDocuments.getDocument(importUri);

        if (importedDocument) {
          const importedProgram = <ElangProgram>(
            importedDocument.parseResult.value
          );

          program.statements.push(
            ...importedProgram.statements.filter(
              (s) => isExportable(s) && s.export
            )
          );
        }
      }
    }
  }

  // If the program contains statements, run through
  // them in sequence

  let end = false;

  if (program.statements)
    for (const statement of program.statements) {
      // Check if the program needs to be interrupted before
      // executing each statement
      await interruptAndCheck(context.cancellationToken);

      // Run the ElangStatement passing the current running context
      await runElangStatement(statement, context, () => {
        end = true;
      });

      if (end) {
        break;
      }
    }

  // Close and finalise the Variables and Types objects for this run
  context.variables.leave();
  context.types.leaveScope();
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
