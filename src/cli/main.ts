import chalk from "chalk";
import { Command } from "commander";
import { NodeFileSystem } from "langium/node";
import * as fs from "node:fs";
import { runInterpreter } from "../interpreter/interpreter.js";
import { createElangServices } from "../language/elang-module.js";
import type { ModelDeclaration } from "../language/generated/ast.js";
import { ElangLanguageMetaData } from "../language/generated/module.js";
import { extractAstNode } from "./cli-util.js";
import { generateJavaScript } from "./generator.js";

export const generateAction = async (
  fileName: string,
  opts: GenerateOptions
): Promise<void> => {
  const services = createElangServices(NodeFileSystem).Elang;
  const model = await extractAstNode<ModelDeclaration>(fileName, services);
  const generatedFilePath = generateJavaScript(
    model,
    fileName,
    opts.destination
  );
  console.log(
    chalk.green(`JavaScript code generated successfully: ${generatedFilePath}`)
  );
};

async function runAction(file: string): Promise<void> {
  const now = Date.now();
  const content = await fs.promises.readFile(file, "utf-8");

  try {
    await runInterpreter(content, {
      log: (value) => console.log(value),
    });
    console.log(`Elang program finished running in ${Date.now() - now}ms`);
  } catch (error) {
    console.log(chalk.red(error));
  }
}

export type GenerateOptions = {
  destination?: string;
};

export default function (): void {
  const program = new Command();

  program.version("0.0.1");

  const fileExtensions = ElangLanguageMetaData.fileExtensions.join(", ");
  program
    .command("generate")
    .argument(
      "<file>",
      `source file (possible file extensions: ${fileExtensions})`
    )
    .option("-d, --destination <dir>", "destination directory of generating")
    .description(
      'generates JavaScript code that prints "Hello, {name}!" for each greeting in a source file'
    )
    .action(generateAction);

  program.command("run").argument("<file>").action(runAction);

  program.parse(process.argv);
}
