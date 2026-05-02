import { NodeFileSystem } from "langium/node";
import { createELangServices } from "../../../language/out/index.js";
import { URI } from "langium";
import * as path from "node:path";
import * as fs from "node:fs";

const services = createELangServices(NodeFileSystem).ELang;
const fileName = path.resolve("./examples/06_Measurements.elng");
const text = fs.readFileSync(fileName, "utf-8");

const document = services.shared.workspace.LangiumDocumentFactory.fromString(
  text,
  URI.file(fileName),
);
await services.shared.workspace.DocumentBuilder.build([document], {
  validation: true,
});

const validationErrors = (document.diagnostics ?? []).filter(
  (e) => e.severity === 1,
);
if (validationErrors.length > 0) {
  console.error("There are validation errors:");
  for (const error of validationErrors) {
    console.error(
      `line ${error.range.start.line + 1}: ${error.message} [${document.textDocument.getText(error.range)}]`,
    );
  }
} else {
  console.log("No validation errors.");
}
