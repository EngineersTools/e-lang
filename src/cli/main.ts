import { Command } from "commander";
import fs from "node:fs";
import { runInterpreter } from "../interpreter/interpreter.js";

async function runCommand(file: string): Promise<void> {
  const now = Date.now();
  const content = await fs.promises.readFile(file, "utf-8");
  await runInterpreter(content, {
    log: (value) => console.log(`${value}`),
  });
  console.log(`ELang program finished running in ${Date.now() - now}ms`);
}

export default function (): void {
  const program = new Command();

  program.version("0.0.6");

  program.command("run").argument("<file>").action(runCommand);

  program.parse(process.argv);
}
