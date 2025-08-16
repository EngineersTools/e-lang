import type { ELangProgram } from "e-lang-language";
import { expandToNode, toString } from "langium/generate";
import * as fs from "node:fs";
import { extractDestinationAndName } from "./util.js";

export function generateOutput(
  model: ELangProgram,
  source: string,
  destination: string
): string {
  const data = extractDestinationAndName(destination);

  const fileNode = expandToNode`
        // TODO : place here generated code
    `.appendNewLineIfNotEmpty();

  if (!fs.existsSync(data.destination)) {
    fs.mkdirSync(data.destination, { recursive: true });
  }
  fs.writeFileSync(destination, toString(fileNode));
  return destination;
}
