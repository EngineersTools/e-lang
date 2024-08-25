import { EmptyFileSystem, type LangiumDocument } from "langium";
import { expandToString as s } from "langium/generate";
import { parseHelper } from "langium/test";
import { beforeAll, describe, expect, test } from "vitest";
import { createELangServices } from "../../src/language/e-lang-module.js";
import {
  ELangProgram,
  isELangProgram,
} from "../../src/language/generated/ast.js";

let services: ReturnType<typeof createELangServices>;
let parse: ReturnType<typeof parseHelper<ELangProgram>>;
let document: LangiumDocument<ELangProgram> | undefined;

beforeAll(async () => {
  services = createELangServices(EmptyFileSystem);
  parse = parseHelper<ELangProgram>(services.ELang);

  // activate the following if your linking test requires elements from a built-in library, for example
  // await services.shared.workspace.WorkspaceManager.initializeWorkspace([]);
});

describe("Parsing tests", () => {
  test("parse simple program", async () => {
    document = await parse(`
            import 'src/path/to/file'
        `);

    // check for absensce of parser errors the classic way:
    //  deacivated, find a much more human readable way below!
    // expect(document.parseResult.parserErrors).toHaveLength(0);

    expect(
      // here we use a (tagged) template expression to create a human readable representation
      //  of the AST part we are interested in and that is to be compared to our expectation;
      // prior to the tagged template expression we check for validity of the parsed document object
      //  by means of the reusable function 'checkDocumentValid()' to sort out (critical) typos first;
      checkDocumentValid(document) ||
        s`
                Imports:
                  ${document.parseResult.value?.imports
                    ?.map((p) => p.importSource)
                    ?.join("\n  ")}
            `
    ).toBe(s`
            Imports:
              src/path/to/file
        `);
  });
});

function checkDocumentValid(document: LangiumDocument): string | undefined {
  return (
    (document.parseResult.parserErrors.length &&
      s`
        Parser errors:
          ${document.parseResult.parserErrors
            .map((e) => e.message)
            .join("\n  ")}
    `) ||
    (document.parseResult.value === undefined &&
      `ParseResult is 'undefined'.`) ||
    (!isELangProgram(document.parseResult.value) &&
      `Root AST object is a ${document.parseResult.value.$type}, expected a '${ELangProgram}'.`) ||
    undefined
  );
}
