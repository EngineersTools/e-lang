import { createELangServices } from "e-lang-language";
import { startLanguageServer } from "langium/lsp";
import { NodeFileSystem } from "langium/node";
import {
  createConnection,
  ProposedFeatures,
} from "vscode-languageserver/node.js";

// Create a connection to the client
const connection = createConnection(ProposedFeatures.all);

// Inject the shared services and language-specific services
const { shared } = createELangServices({ connection, ...NodeFileSystem });

// fs.mkdirSync(path.join(__dirname, "logs"), { recursive: true });

// shared.lsp.LanguageServer.onInitialize(() => {
//   setupLogging(path.join(__dirname, "logs", "language.log"));
// });

// Start the language server with the shared services
startLanguageServer(shared);
