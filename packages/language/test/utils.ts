import { EmptyFileSystem, LangiumDocument } from "langium";
import { parseDocument } from "langium/test";
import { deleteAllDocuments } from "typir-langium";
import { compareValidationIssuesStrict } from "typir/test";
import { afterEach, expect } from "vitest";
import type { Diagnostic } from "vscode-languageserver-types";
import { DiagnosticSeverity } from "vscode-languageserver-types";
import {
  createELangServices
} from "../src/index.js";

const elangServices = createELangServices(EmptyFileSystem).ELang;

afterEach(async () => {
  await deleteAllDocuments(elangServices.shared);
});

export async function validateElang(
  code: string,
  errors: number | string | string[],
  warnings: number | string | string[] = 0
): Promise<LangiumDocument> {
  const document = await parseDocument(elangServices, code.trim());
  const diagnostics: Diagnostic[] =
    await elangServices.validation.DocumentValidator.validateDocument(document);

  const diagnosticsErrors: string[] = diagnostics
    .filter((diag) => diag.severity === DiagnosticSeverity.Error)
    .map((diag) => diag.message);

  const diagnosticsWarnings: string[] = diagnostics
    .filter((diag) => diag.severity === DiagnosticSeverity.Warning)
    .map((diag) => diag.message);

  checkIssues(diagnosticsErrors, errors);
  checkIssues(diagnosticsWarnings, warnings);

  return document;
}

function checkIssues(
  diagnosticsErrors: string[],
  errors: number | string | string[]
): void {
  const msgError = diagnosticsErrors.join("\n");

  if (typeof errors === "number") {
    expect(diagnosticsErrors, msgError).toHaveLength(errors);
  } else if (typeof errors === "string") {
    expect(diagnosticsErrors, msgError).toHaveLength(1);
    expect(diagnosticsErrors[0], msgError).includes(errors);
  } else {
    compareValidationIssuesStrict(diagnosticsErrors, errors);
  }
}
