import { AstNode, LangiumDocument, MaybePromise, URI } from "langium";
import { LangiumSharedServices } from "langium/lsp";
import { NodeFileSystem } from "langium/node";
import { v4 } from "uuid";
import {
  createELangServices,
  ELangServices,
} from "../language/e-lang-module.js";
import { ELangProgram } from "../language/generated/ast.js";
import { BuildResult } from "./BuildResult.js";
import { runProgram } from "./runProgram.js";
import { resolveImportUri } from "../language/e-lang-scope.js";

export const services = createELangServices(NodeFileSystem);

/**
 * Expresses the context in which the interpreter
 * is running.
 * It has two elements:
 *  - log: is a sync/async function that the interpreter can use
 *         to write outputs to. The function takes one argument which
 *         is the value to be written to the log.
 *  - onStart(): An optional function that runs before the
 *               interpreter starts
 */
export interface InterpreterContext {
  log: (value: unknown) => MaybePromise<void>;
  uri?: URI;
  onStart?: () => void;
}

function addDocumentToServices(
  services: {
    shared: LangiumSharedServices;
    ELang: ELangServices;
  },
  program: string,
  docUri?: URI
) {
  const uri = docUri ?? URI.parse(`memory:///${v4()}.el`);
  const document = services.shared.workspace.LangiumDocumentFactory.fromString(
    program,
    uri
  );

  services.shared.workspace.LangiumDocuments.addDocument(document);

  return { document, uri };
}

/**
 * A function that builds a LangiumDocument in memory from
 * the text of an ELang program
 * @param program The text with the ELang program code
 * @returns A promise with the built document
 */
async function buildDocument(
  program: string,
  docUri?: URI
): Promise<BuildResult> {
  const { document, uri } = addDocumentToServices(services, program, docUri);

  const documents: LangiumDocument<AstNode>[] = [];
  const uris: URI[] = [];

  documents.push(document);
  uris.push(uri);

  const imports = (document.parseResult.value as ELangProgram).imports;

  const importPromises: Promise<LangiumDocument<AstNode>>[] = [];

  imports.forEach((imp) => {
    const uri = resolveImportUri(imp);
    if (uri) {
      uris.push(uri);
      importPromises.push(
        services.shared.workspace.LangiumDocumentFactory.fromUri(uri)
      );
    }
  });

  documents.push(...(await Promise.all(importPromises)));

  await services.shared.workspace.DocumentBuilder.build(documents);
  return {
    document,
    dispose: async () => {
      await services.shared.workspace.DocumentBuilder.update([], uris);
    },
  };
}

/**
 * Runs an ELang program. This is the entry point of a program
 * execution as called by the notebook-kernel or the cli.
 * @param program Text containing the code of the program
 * @param context The context in which this program is running
 */
export async function runInterpreter(
  program: string,
  context: InterpreterContext
): Promise<void> {
  // Build a LangiumDocument using the text of the program
  const buildResult = await buildDocument(program, context.uri);

  // Try to run the built program
  try {
    // Take the result of parsing the built document and parse it as an
    // ELang program type
    const elangProgram = <ELangProgram>buildResult.document.parseResult.value;
    await runProgram(elangProgram, context);
  } finally {
    // Call the 'dispose()' function after the program is finished
    await buildResult.dispose();
  }
}
