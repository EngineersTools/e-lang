import { createELangServices } from "e-lang-language";
import { startLanguageServer } from "langium/lsp";
import { NodeFileSystem } from "langium/node";
import fs from "node:fs";
import path from "node:path";
import {
  createConnection,
  ProposedFeatures,
} from "vscode-languageserver/node.js";
import { setupLogging } from "../setupLogging.js";

// Create a connection to the client
const connection = createConnection(ProposedFeatures.all);

// Inject the shared services and language-specific services
const { shared } = createELangServices({ connection, ...NodeFileSystem });

fs.mkdirSync(path.join(__dirname, "logs"), { recursive: true });
setupLogging(path.join(__dirname, "logs", "language.log"));

try {
  // Start the language server with the shared services
  startLanguageServer(shared);
} catch (error) {
  console.error("Error starting language server:", error);
}
