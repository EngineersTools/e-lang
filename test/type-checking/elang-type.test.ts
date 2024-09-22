import { EmptyFileSystem, LangiumDocument } from "langium";
import { parseHelper } from "langium/test";
import { beforeAll, describe, test } from "vitest";
import { createELangServices } from "../../src/language/e-lang-module.js";
import {
  ELangProgram
} from "../../src/language/generated/ast.js";

let services: ReturnType<typeof createELangServices>;
let parse: ReturnType<typeof parseHelper<ELangProgram>>;
let document: LangiumDocument<ELangProgram> | undefined;

beforeAll(async () => {
  services = createELangServices(EmptyFileSystem);
  parse = parseHelper<ELangProgram>(services.ELang);
});

describe("Formula Type", () => {
  test.todo("Get correct type name", async () => {
    document = await parse(`
        formula add(x: number, y: number) returns number {
            return x + y
        }
    `);

    // const formulaStatement = document.parseResult.value
    //   .statements[0] as FormulaDeclaration;

    // const formulaType = ;

    // expect(formulaType.getName()).toBe("(number, number) => number");
  });
});
