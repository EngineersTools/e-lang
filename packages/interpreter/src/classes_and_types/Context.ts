import { MaybePromise, URI } from "langium";
import { CancellationToken } from "vscode-languageserver";
import { Variables } from "./Variables.js";

/**
 * Execution context provided to the interpreter.
 *
 * Provides hooks and metadata that influence runtime behavior:
 * @property log - function to receive runtime messages or diagnostics. Accepts any value and may return a Promise<void>.
 * @property onStart - callback invoked when interpretation starts.
 * @property uri - URI identifying the source or module being interpreted.
 */
export interface InterpreterContext {
  log: (value: unknown) => MaybePromise<void>;
  onStart: () => void;
  uri: URI;
}

/**
 * Execution context passed to the interpreter/runner.
 *
 * Extends InterpreterContext with runtime-specific controls:
 * - variables: the current set of interpreter variables.
 * - cancellationToken: token used to request early cancellation of execution.
 * - timeout: NodeJS.Timeout handle associated with the running execution (e.g. to enforce a time limit).
 *
 * @remarks
 * Consumers should avoid keeping long-lived references to this context after execution finishes.
 */
export interface RunnerContext extends InterpreterContext {
  variables: Variables;
  parentScope?: Variables;
  cancellationToken: CancellationToken;
  timeout: NodeJS.Timeout;
}
