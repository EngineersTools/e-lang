import { CancellationToken } from "vscode-languageserver";
import { InterpreterContext } from "./interpreter.js";
import { Variables } from "./Variables.js";

/**
 * Represents the context in which an ELang program is running.
 * The RunnerContext is created after the InterpreterContext has
 * been created.
 * In addition to the {@link InterpreterContext} properties, the
 * RunnerContext has the following properties:
 *  - variables: an object containing all the variables available
 *               in the scope of this context
 *  - cancellationToken: A Cancellation Token that can be used to
 *                       stop the execution of an ELang program
 */

export interface RunnerContext extends InterpreterContext {
  variables: Variables;
  cancellationToken: CancellationToken;
  timeout: NodeJS.Timeout;
}
