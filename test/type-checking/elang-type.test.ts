import { EmptyFileSystem, LangiumDocument } from "langium";
import { parseHelper } from "langium/test";
import { beforeAll, describe, expect, test } from "vitest";
import { createELangServices } from "../../src/language/e-lang-module.js";
import {
  ELangProgram,
  FormulaDeclaration,
} from "../../src/language/generated/ast.js";
import { ELangType } from "../../src/language/type-system/ELangType.js";

let services: ReturnType<typeof createELangServices>;
let parse: ReturnType<typeof parseHelper<ELangProgram>>;
let document: LangiumDocument<ELangProgram> | undefined;

beforeAll(async () => {
  services = createELangServices(EmptyFileSystem);
  parse = parseHelper<ELangProgram>(services.ELang);
});

describe("Formula Type", () => {
  test("Get correct type name", async () => {
    document = await parse(`
        formula add(x: number, y: number) returns number {
            return x + y
        }
    `);

    const formulaStatement = document.parseResult.value
      .statements[0] as FormulaDeclaration;

    const formulaType = new ELangType.Formula(
      formulaStatement.name,
      formulaStatement.parameters,
      formulaStatement.returnType
    );

    expect(formulaType.getName()).toBe("(number, number) => number");
  });
});
