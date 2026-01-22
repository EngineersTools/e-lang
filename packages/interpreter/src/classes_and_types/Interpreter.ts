import { createELangServices, ELangProgram, isELangProgram } from 'e-lang-language';
import { LangiumDocument, URI } from 'langium';
import { NodeFileSystem } from 'langium/node';
import { CancellationTokenSource } from 'vscode-languageserver';
import { runProgram } from '../functions/runProgram.js';
import { RunnerContext } from './Context.js';
import { Variables } from './index.js';

export const TIMEOUT_MS = 1000000 * 5;

/**
 * Interpreter for ELang programs.
 *
 * Creates an execution environment that can evaluate either an ELangProgram
 * or a LangiumDocument<ELangProgram>. The instance maintains an internal
 * interpreter context and an optional runner context, and uses a configurable
 * logger (defaults to console.log).
 *
 * Constructor options:
 * - context.logger: optional function to receive log messages emitted by the interpreter.
 * - context.interpreterContext: optional prebuilt InterpreterContext; if omitted a default
 *   context with a `log` function and an in-memory URI is used.
 * - context.runnerContext: optional RunnerContext passed through to the program runner.
 *
 * Primary behavior:
 * - eval(programOrDoc): asynchronously runs the given program or document. If a
 *   LangiumDocument is supplied and it contains diagnostics with severity === 1,
 *   eval will throw an Error summarizing the static type check failures.
 *
 * @param context - Optional configuration object for the interpreter instance.
 * @param context.logger - Custom logger function used by the interpreter (defaults to console.log).
 * @param context.interpreterContext - Optional InterpreterContext to use as the runtime environment.
 * @param context.runnerContext - Optional RunnerContext passed to the program runner.
 *
 * @throws Error When eval is called with a LangiumDocument that contains diagnostics
 *               of severity 1 (static type check failures).
 *
 * @example
 * const interpreter = new Interpreter({ logger: msg => console.debug(msg) });
 * await interpreter.eval(myProgram);
 *
 * @public
 */
export class Interpreter {
    private _logger: (message: any) => void;
    private _runnerContext: RunnerContext;

    constructor(context: { logger?: (message: any) => void, runnerContext?: RunnerContext } = {}, parentScope?: Variables) {

        this._logger = context.logger ?? console.log;

        const cancellationTokenSource = new CancellationTokenSource();
        const cancellationToken = cancellationTokenSource.token;

        const timeout = setTimeout(async () => {
            cancellationTokenSource.cancel();
        }, TIMEOUT_MS);

        this._runnerContext = {
            log: (msg) => { this._logger(msg); },
            uri: URI.parse('memory:///current.elng'),
            onStart: context.runnerContext?.onStart ?? (() => { }),
            cancellationToken: context.runnerContext?.cancellationToken ?? cancellationToken,
            timeout: context.runnerContext?.timeout ?? timeout,
            variables: context.runnerContext?.variables ?? new Variables(parentScope),
            parentScope: context.runnerContext?.parentScope ?? parentScope,
        }
    }

    async eval(programOrDoc: ELangProgram | LangiumDocument<ELangProgram>): Promise<Variables> {
        let program: ELangProgram;

        if (isELangProgram(programOrDoc)) {
            program = programOrDoc;
        } else {
            const doc = programOrDoc as LangiumDocument<ELangProgram>;
            const services = createELangServices(NodeFileSystem);
            const docValidation = await services.ELang.validation.DocumentValidator.validateDocument(doc);
            program = doc.parseResult.value;

            if (docValidation && docValidation.length > 0) {
                if (!doc.diagnostics) doc.diagnostics = [];
                doc.diagnostics.push(...docValidation);
            }

            if (doc.diagnostics) {
                const errors = doc.diagnostics.filter(d => d.severity === 1);
                if (errors.length > 0) {
                    throw new Error(`Static Type Check Failed:\n${errors.map(e => `[${e.range.start.line + 1}:${e.range.start.character + 1}] ${e.message}`).join('\n')}`);
                }
            }
        }

        return await runProgram(program, this._runnerContext);
    }
}