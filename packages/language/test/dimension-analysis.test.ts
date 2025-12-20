import { describe, expect, test, beforeAll } from "vitest";
import { EmptyFileSystem } from "langium";
import { parseHelper } from "langium/test";
import { createELangServices } from "../src/e-lang-module.js";
import { ELangProgram } from "../src/generated/ast.js";

let services: ReturnType<typeof createELangServices>;
let parse: ReturnType<typeof parseHelper<ELangProgram>>;

beforeAll(() => {
    services = createELangServices(EmptyFileSystem);
    const doParse = parseHelper<ELangProgram>(services.ELang);
    parse = (input: string) => doParse(input, { validation: true });
});

describe('Dimension Analysis Tests', () => {

    test('Parse Dimension Declaration Only', async () => {
        const document = await parse('dimension Length;');
        if (document.parseResult.parserErrors.length > 0) {
            console.error('Dim Parse Errors:', JSON.stringify(document.parseResult.parserErrors, null, 2));
        }
        expect(document.parseResult.parserErrors).toHaveLength(0);
    });

    test('Parse Base Unit Declaration', async () => {
        const document = await parse(`
            dimension Length;
            unit meter : Length;
        `);
        if (document.parseResult.parserErrors.length > 0) {
            console.error('Base Unit Parse Errors:', JSON.stringify(document.parseResult.parserErrors, null, 2));
        }
        expect(document.parseResult.parserErrors).toHaveLength(0);
    });

    test('Parse Derived Unit Declaration', async () => {
        const document = await parse(`
            dimension Length;
            dimension Time;
            unit meter : Length;
            unit second : Time;
            unit speed = meter / second;
        `);
        if (document.parseResult.parserErrors.length > 0) {
            console.error('Derived Unit Parse Errors:', JSON.stringify(document.parseResult.parserErrors, null, 2));
        }
        expect(document.parseResult.parserErrors).toHaveLength(0);
    });

    test('Valid Derived Unit Declaration', async () => {
        const document = await parse(`
            dimension Length;
            dimension Time;
            unit meter : Length;
            unit second : Time;
            
            unit Velocity = meter / second;
            unit Acceleration = meter / second^2;
        `);

        expect(document.parseResult.parserErrors).toHaveLength(0);
        expect(document.diagnostics).toHaveLength(0);
    });

    test('Infer Valid Operations (Matches)', async () => {
        const document = await parse(`
            dimension Length;
            unit m : Length;
            
            var a = 10 m;
            var b = 5 m;
            var c = a + b; // Should be valid
            var d = a - b; // Should be valid
        `);

        if (document.parseResult.parserErrors.length > 0) {
            console.error('Ops Parse Errors:', JSON.stringify(document.parseResult.parserErrors, null, 2));
        }
        if (document.diagnostics && document.diagnostics.length > 0) {
            console.error('Ops Diagnostics:', JSON.stringify(document.diagnostics, null, 2));
        }

        expect(document.parseResult.parserErrors).toHaveLength(0);
        expect(document.diagnostics).toHaveLength(0);
    });

    test('Detect Dimension Mismatch in Addition', async () => {
        const document = await parse(`
            dimension Length;
            dimension Time;
            unit m : Length;
            unit s : Time;
            
            var a = 10 m;
            var b = 5 s;
            var c = a + b; // Error: Length + Time
        `);

        expect(document.parseResult.parserErrors).toHaveLength(0);
        // We expect a validation error
        expect(document.diagnostics).toHaveLength(1);
        const error = document.diagnostics![0];
        expect(error.severity).toBe(1); // Error
        expect(error.message).toMatch(/Dimension mismatch/);
    });

    test('Complex Derived Unit Inference', async () => {
        const document = await parse(`
            dimension Length;
            dimension Time;
            unit m : Length;
            unit s : Time;
            
            unit Velocity = m / s;

            var d = 100 m;
            var t = 10 s;
            var v_calc = d / t; // Should Infer Velocity
            
            var v_lit = 10 Velocity;

            // This should be valid if v_calc inferred correctly
            var check = v_calc + v_lit; 
        `);

        expect(document.parseResult.parserErrors).toHaveLength(0);
        expect(document.diagnostics).toHaveLength(0); // If inference works, these are compatible
    });

    test('Scalar Result', async () => {
        const document = await parse(`
            dimension Length;
            unit m : Length;

            var a = 10 m;
            var b = 5 m;
            var ratio = a / b; // Should be scalar (number)
            
            var num = 2;
            var check = ratio + num; // Should be valid (number + number)
        `);

        expect(document.parseResult.parserErrors).toHaveLength(0);
        expect(document.diagnostics).toHaveLength(0);
    });
});
