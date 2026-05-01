import { createELangServices, ELangProgram } from 'e-lang-language';
import { EmptyFileSystem, LangiumDocument } from 'langium';
import { parseHelper } from 'langium/test';
import { beforeAll, describe, expect, test } from 'vitest';
import { Interpreter } from '../src/classes_and_types/Interpreter.js';

describe('Interpreter Tests', () => {
    let services: any;
    let parse: (input: string) => Promise<LangiumDocument<ELangProgram>>;

    beforeAll(async () => {
        services = createELangServices(EmptyFileSystem).ELang;
        parse = parseHelper<ELangProgram>(services);
    });

    async function evalCode(code: string) {
        const doc = await parse(code);
        if (doc.parseResult.parserErrors.length > 0) {
            throw new Error(`Parse errors: ${doc.parseResult.parserErrors.map(e => e.message).join(', ')}`);
        }
        
        const logs: any[] = [];
        const interpreter = new Interpreter({
            logger: (msg) => logs.push(msg)
        });
        
        const variables = await interpreter.eval(doc.parseResult.value);
        return { variables, logs };
    }

    test('01: Variable declaration and arithmetic', async () => {
        const code = `
            const a = 10
            const b = 20
            const c = a + b
            print c
            
            var counter = 0
            counter = 42
            print counter
        `;
        const { variables, logs } = await evalCode(code);
        expect(logs).toEqual(["30", "42"]);
        expect(variables.getAll()['c']).toBe(30);
        expect(variables.getAll()['counter']).toBe(42);
    });

    test('02: Arithmetic operations', async () => {
        const code = `
            const a = 10
            const b = 3
            print a + b
            print a - b
            print a * b
            print a / b
            print a ^ 2
            print -a
            print a + b * 2
            print (a + b) * 2
            var c = 5
            print c++
            print c
            print c--
            print c
        `;
        const { logs } = await evalCode(code);
        expect(logs).toEqual([
            "13", "7", "30", "3.3333333333333335", "100", "-10", "16", "26", 
            "5", "6", "6", "5"
        ]);
    });

    test('03: Logical operations', async () => {
        const code = `
            print true and false
            print true or false
            print not false
            print 10 > 5
            print 10 >= 10
            print 5 < 10
            print 5 <= 5
            print 10 == 10
            print 10 != 5
        `;
        const { logs } = await evalCode(code);
        expect(logs).toEqual([
            "false", "true", "true", "true", "true", "true", "true", "true", "true"
        ]);
    });

    test('04: Dimensions and Units', async () => {
        const code = `
            domain physics
            dimension Length
            dimension Time
            
            unit m: Length
            unit km: Length
            unit s: Time
            unit h: Time
            
            unit km_per_h = km / h
            unit m_per_s = m / s
            
            const distance = 10 * km
            const time = 2 * h
            const velocity = distance / time
            
            print velocity
            print velocity ~ km_per_h
            print velocity ~ m_per_s
        `;
        const { logs } = await evalCode(code);
        expect(logs.length).toBe(3);
    });
    
    test('05: Control Flow', async () => {
        const code = `
            var x = 0
            if (true) {
                x = 1
            } else {
                x = 2
            }
            print x
            if (false) {
                x = 3
            } else_if (true) {
                x = 4
            }
            print x
        `;
        const { logs } = await evalCode(code);
        expect(logs).toEqual(["1", "4"]);
    });

    test('06: Match Statements', async () => {
        const code = `
            const state = 1
            var result = ""
            match state {
                0 => result = "Idle"
                1 => result = "Running"
                default => result = "Unknown"
            }
            print result
        `;
        const { logs } = await evalCode(code);
        expect(logs).toEqual(["Running"]);
    });

    test('07: For Loops', async () => {
        const code = `
            var sum = 0
            for (var i from 1 to 5) {
                sum = sum + i
            }
            print sum
            
            var sum2 = 0
            for (var i from 0 to 10 step 2) {
                sum2 = sum2 + i
            }
            print sum2
        `;
        const { logs } = await evalCode(code);
        expect(logs).toEqual(["15", "30"]);
    });

    test('08: Collections', async () => {
        const code = `
            const arr = [10, 20, 30]
            print arr
            print arr[1]
        `;
        const { logs } = await evalCode(code);
        expect(logs[0]).toEqual("[10, 20, 30]");
        expect(logs[1]).toBe("20");
    });

    test('09: Lambdas and Closures', async () => {
        const code = `
            const square = (x: number) => x ^ 2
            print square(5)
            
            const create_multiplier = (factor: number) => {
                return (x: number) => x * factor
            }
            const times_ten = create_multiplier(10)
            print times_ten(5)
        `;
        const { logs } = await evalCode(code);
        expect(logs).toEqual(["25", "50"]);
    });

    test('10: Formulas and Recursion', async () => {
        const code = `
            formula factorial(n: number): number {
                if (n <= 1) { return 1 }
                return n * factorial(n - 1)
            }
            print factorial(5)
        `;
        const { logs } = await evalCode(code);
        expect(logs).toEqual(["120"]);
    });

    test('11: Models', async () => {
        const code = `
            model Vector3D {
                x: number,
                y: number,
                z: number
            }
            const v = { x: 10, y: 20, z: 30 }
            print v.x
            print v.y
            print v.z
        `;
        const { logs } = await evalCode(code);
        expect(logs).toEqual(["10", "20", "30"]);
    });
});
