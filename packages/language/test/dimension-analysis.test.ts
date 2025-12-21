import { EmptyFileSystem } from "langium";
import { parseHelper } from "langium/test";
import { beforeAll, describe, expect, test } from 'vitest';
import { createELangServices } from "../src/e-lang-module.js";
import { ELangProgram } from '../src/index.js';


let services: ReturnType<typeof createELangServices>;
let parse:    ReturnType<typeof parseHelper<ELangProgram>>;
// let document: LangiumDocument<ELangProgram> | undefined;

beforeAll(async () => {
    services = createELangServices(EmptyFileSystem);
    parse = parseHelper<ELangProgram>(services.ELang);

    // activate the following if your linking test requires elements from a built-in library, for example
    // await services.shared.workspace.WorkspaceManager.initializeWorkspace([]);
});

describe('Dimension Analysis', () => {

    test('Parse and Calculate Base Unit Dimensions', async () => {
        const document = await parse(`
            dimension Length
            unit m : Length
        `);
        expect(document.parseResult.parserErrors).toHaveLength(0);
        expect(document.diagnostics ?? []).toHaveLength(0);
    });

    test('Parse and Calculate Derived Unit Dimensions', async () => {
        const document = await parse(`
            dimension Length
            dimension Time
            unit m : Length
            unit s : Time
            unit Velocity = m / s // Unit inference
        `);
        expect(document.parseResult.parserErrors).toHaveLength(0);
        expect(document.diagnostics ?? []).toHaveLength(0);
    });

    test('Infer Valid Operations (Matches)', async () => {
        const document = await parse(`
            dimension Length
            unit m : Length
            
            var a = 10 m
            var b = 5 m
            var c = a + b // Should be valid
            var d = a - b // Should be valid
        `);
        expect(document.parseResult.parserErrors).toHaveLength(0);
        expect(document.diagnostics ?? []).toHaveLength(0);
    });

    test('Detect Dimension Mismatch in Addition', async () => {
        const document = await parse(`
            dimension Length
            dimension Time
            unit m : Length
            unit s : Time
            
            var a = 10 m
            var b = 5 s
            var c = a + b // Error: Length + Time
        `);
        expect(document.parseResult.parserErrors).toHaveLength(0);
        // Expect validation error
        expect(document.diagnostics).toBeDefined();
        expect(document.diagnostics).not.toHaveLength(0);
        const error = document.diagnostics![0];
        expect(error.severity).toBe(1); // Error
        // Expecting collision or mismatch error from Typir
    });

    test('Scalar Result from Division', async () => {
        const document = await parse(`
            dimension Length
            unit m : Length

            var a = 10 m
            var b = 5 m
            var ratio = a / b // Should be scalar (number)
            
            var num = 2
            var check = ratio + num // Should be valid (number + number)
        `);
        expect(document.parseResult.parserErrors).toHaveLength(0);
        expect(document.diagnostics ?? []).toHaveLength(0);
    });
});
