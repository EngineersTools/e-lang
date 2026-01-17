import { ELangProgram, ELangServices } from 'e-lang-language';
import { LangiumDocument, URI } from 'langium';
import { LangiumSharedServices } from 'langium/lsp';
import { runProgram } from './runProgram.js';
import { InterpreterContext } from './RunnerContext.js';
import { createELangServices } from 'e-lang-language';
import { NodeFileSystem } from 'langium/node';

export class Interpreter {
    private logger: (message: any) => void = console.log;

    constructor(logger?: (message: any) => void) {
        if (logger) {
            this.logger = logger;
        }
    }

    async eval(programOrDoc: ELangProgram | LangiumDocument<ELangProgram>): Promise<any> {
        let program: ELangProgram;
        if ('$type' in programOrDoc) {
             program = programOrDoc as ELangProgram;
        } else {
             const doc = programOrDoc as LangiumDocument<ELangProgram>;
             program = doc.parseResult.value;
             if (doc.diagnostics) {
                 const errors = doc.diagnostics.filter(d => d.severity === 1);
                 if (errors.length > 0) {
                     throw new Error(`Static Type Check Failed:\n${errors.map(e => `[${e.range.start.line + 1}:${e.range.start.character + 1}] ${e.message}`).join('\n')}`);
                 }
             }
        }

        const context: InterpreterContext = {
            log: (msg) => { this.logger(msg); },
            uri: URI.parse('memory:///current.elng')
        };

        await runProgram(program, context);
        return undefined;
    }
}

export const services: { shared: LangiumSharedServices, ELang: ELangServices } = createELangServices(NodeFileSystem);
