import { CancellationToken } from "vscode-languageserver";
import { URI, MaybePromise } from "langium";
import { Variables } from "./Variables.js";

export interface InterpreterContext {
  log: (value: unknown) => MaybePromise<void>;
  uri?: URI;
  onStart?: () => void;
}

/**
 * Represents the context in which an ELang program is running.
 * The RunnerContext is created after the InterpreterContext has
 * been created.
 */
export interface RunnerContext extends InterpreterContext {
  variables: Variables;
  cancellationToken: CancellationToken;
  timeout: NodeJS.Timeout;
}
