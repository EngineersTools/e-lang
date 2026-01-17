import fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";
import type {
  LanguageClientOptions,
  ServerOptions,
} from "vscode-languageclient/node.js";
import { LanguageClient, TransportKind } from "vscode-languageclient/node.js";
import { setupLogging } from "../setupLogging.js";

import { ELangNotebookSerializer } from './notebook/serializer.js';

let client: LanguageClient;
let notebookKernel: any;

// Output channel for notebook debugging
const notebookOutput = vscode.window.createOutputChannel("E-Lang Notebook");

// This function is called when the extension is activated.
export function activate(
  context: vscode.ExtensionContext
): void {
  notebookOutput.appendLine('[Main] Extension activated (synchronous part).');

  context.subscriptions.push(
    vscode.workspace.registerNotebookSerializer(
        'e-lang-notebook',
        new ELangNotebookSerializer(notebookOutput),
        { transientOutputs: false }
    )
  );

  // Initialize heavy components asynchronously to avoid blocking activation
  (async () => {
      // Short delay to ensure activation is truly complete and UI is responsive
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
          const { ELangNotebookKernel } = await import('./notebook/controller.js');
          notebookKernel = new ELangNotebookKernel();
          notebookOutput.appendLine('[Main] ELangNotebookKernel created successfully');
          context.subscriptions.push(notebookKernel);

          // Auto-select kernel when opening e-lang notebooks
          context.subscriptions.push(
              vscode.workspace.onDidOpenNotebookDocument(async (doc) => {
                  if (doc.notebookType === 'e-lang-notebook') {
                      notebookOutput.appendLine('[Main] E-Lang notebook opened, kernel available');
                      // The kernel is automatically associated with notebooks of this type
                  }
              })
          );
      } catch (err) {
          notebookOutput.appendLine('[Main] Failed to create ELangNotebookKernel: ' + err);
          console.error('Failed to create ELangNotebookKernel:', err);
      }

      try {
          client = await startLanguageClient(context);
      } catch (err) {
            console.error('Failed to create LanguageClient:', err);
      }
  })();
}

// This function is called when the extension is deactivated.
export function deactivate(): Thenable<void> | undefined {
  if (client) {
    return client.stop();
  }
  return undefined;
}

async function startLanguageClient(
  context: vscode.ExtensionContext
): Promise<LanguageClient> {
  const serverModule = context.asAbsolutePath(
    path.join("out", "language", "main.cjs")
  );

  const debugOptions = {
    execArgv: [
      "--nolazy",
      `--inspect${process.env.DEBUG_BREAK ? "-brk" : ""}=${
        process.env.DEBUG_SOCKET || "6009"
      }`,
    ],
  };

  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "*", language: "e-lang" }],
  };

  const client = new LanguageClient(
    "e-lang",
    "ELang",
    serverOptions,
    clientOptions
  );

  fs.mkdirSync(path.join(__dirname, "logs"), { recursive: true });
  setupLogging(path.join(__dirname, "logs", "extension.log"));

  try {
    await client.start();
  } catch (error) {
    console.error("Error starting language client:", error);
  }

  return client;
}
