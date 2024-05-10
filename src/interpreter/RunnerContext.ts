import { CancellationToken } from "vscode-languageserver";
import { TypeEnvironment } from "../language/type-system/Types.js";
import { InterpreterContext } from "./interpreter.js";
import { Variables } from "./Variables.js";

/**
 * Represents the context in which an Elang program is running.
 * The RunnerContext is created after the InterpreterContext has
 * been created.
 * In addition to the {@link InterpreterContext} properties, the
 * RunnerContext has the following properties:
 *  - variables: an object containing all the variables available
 *               in the scope of this context
 *  - cancellationToken: A Cancellation Token that can be used to
 *                       stop the execution of an Elang program
 */

export interface RunnerContext extends InterpreterContext {
  types: TypeEnvironment;
  variables: Variables;
  cancellationToken: CancellationToken;
  timeout: NodeJS.Timeout;
}
