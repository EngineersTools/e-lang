import { describe, test, expect, beforeAll, afterEach } from 'vitest';
import { createELangServices } from '../src/e-lang-module.js';
import { EmptyFileSystem, LangiumDocument, AstUtils } from 'langium';
import { parseHelper, clearDocuments } from 'langium/test';
import { ELangProgram, isMemberAccess } from '../src/generated/ast.js';

let services: ReturnType<typeof createELangServices>;
let parse: ReturnType<typeof parseHelper<ELangProgram>>;
let document: LangiumDocument<ELangProgram> | undefined;

beforeAll(async () => {
    services = createELangServices(EmptyFileSystem);
    parse = parseHelper<ELangProgram>(services.ELang);
});

afterEach(async () => {
    document && clearDocuments(services.shared, [ document ]);
});

describe('Linking tests', () => {

    test('Model property scoping', async () => {
        const input = `
            model Person {
                name: text
            }
            var p: Person
            p.name
        `;
        document = await parse(input);
        const root = document.parseResult.value;
        const memberAccess = AstUtils.streamAllContents(root).find(isMemberAccess);
        expect(memberAccess).toBeDefined();
        if (memberAccess) {
            expect(memberAccess.member.ref).toBeDefined();
            expect(memberAccess.member.ref?.name).toBe('name');
        }
    });

    test('Model inheritance scoping', async () => {
        const input = `
            model Animal {
                age: number
            }
            model Dog extends Animal {
                breed: text
            }
            var d: Dog
            d.age
            d.breed
        `;
        document = await parse(input);
        const root = document.parseResult.value;
        const memberAccesses = AstUtils.streamAllContents(root).filter(isMemberAccess).toArray();
        expect(memberAccesses.length).toBe(2);
        
        // d.age
        const ageAccess = memberAccesses.find(ma => ma.member.$refText === 'age');
        expect(ageAccess).toBeDefined();
        expect(ageAccess?.member.ref).toBeDefined();
        expect(ageAccess?.member.ref?.name).toBe('age');

        // d.breed
        const breedAccess = memberAccesses.find(ma => ma.member.$refText === 'breed');
        expect(breedAccess).toBeDefined();
        expect(breedAccess?.member.ref).toBeDefined();
        expect(breedAccess?.member.ref?.name).toBe('breed');
    });

    test('Model expression assignment', async () => {
        const input = `
            model Person {
                name: text
            }
                
            var p: Person = {
                name: "John"
            }

            p.name
        `;

        expect(() => parse(input)).not.toThrow();
        document = await parse(input);
        const root = document.parseResult.value;
        const memberAccess = AstUtils.streamAllContents(root).find(isMemberAccess);
        expect(memberAccess).toBeDefined();
        if (memberAccess) {
            expect(memberAccess.member.ref).toBeDefined();
            expect(memberAccess.member.ref?.name).toBe('name');
        }
    });
});
