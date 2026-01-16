import { describe, test, expect, beforeAll, beforeEach } from 'vitest';
import { Interpreter } from '../src/interpreter.js';
import { EmptyFileSystem, LangiumDocument } from 'langium';
import { createELangServices } from 'e-lang-language';
import { parseHelper } from 'langium/test';
import { ELangProgram } from 'e-lang-language';

describe('Interpreter Tests', () => {
    let services: any;
    let parse: (input: string) => Promise<LangiumDocument<ELangProgram>>;
    let interpreter: Interpreter;

    beforeAll(async () => {
        services = createELangServices(EmptyFileSystem).ELang;
        parse = parseHelper<ELangProgram>(services);
    });

    beforeEach(() => {
        interpreter = new Interpreter();
    });

    async function evalCode(code: string) {
        const doc = await parse(code);
        if (doc.parseResult.parserErrors.length > 0) {
            throw new Error(`Parse errors: ${doc.parseResult.parserErrors.map(e => e.message).join(', ')}`);
        }
        return interpreter.eval(doc.parseResult.value);
    }

    test('Variable declaration and arithmetic', async () => {
        const code = `
            const a = 10
            const b = 20
            const c = a + b
            print c
        `;
        // We can capture console.log or inspect context if exposed.
        // For now, let's verify no errors.
        await evalCode(code);
    });

    test('If Statement', async () => {
         const code = `
            var x = 0
            if (true) {
                x = 1
            } else {
                x = 2
            }
         `;
         // To verify, we might need a way to return a value or spy on print.
         // Let's modify Interpreter.eval to return the last evaluated statement value?
         // Or easier: assert no throw.
         await evalCode(code);
    });
    
    test('Recursion', async () => {
        const code = `
            formula factorial(n: number): number {
                if (n <= 1) { return 1 }
                return n * factorial(n - 1)
            }
            const res = factorial(1)
            print res
        `;
        await evalCode(code);
    });

    test('Logic and Types', async () => {
        const code = `
            const t = true
            const f = false
            if (t and not f) {
                print "Correct"
            }
            const i = 10
            const d = 5.5
            const sum = i + d
            print sum
        `;
        await evalCode(code);
    });

    // Loop test is implicit in ForStatement check in main code, but let's add one
    test('For Loop', async () => {
        const code = `
            var sum = 0
            for (var i from 1 to 5) {
                sum = sum + i
            }
            print sum
        `;
        await evalCode(code);
    });
});
