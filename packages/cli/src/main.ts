import { Command } from 'commander';
import { createELangServices, ELangLanguageMetaData, ELangProgram } from 'e-lang-language';
import { NodeFileSystem } from 'langium/node';
import { Interpreter } from 'e-lang-interpreter';
import { extractAstNode } from './util.js';
import chalk from 'chalk';
import * as url from 'node:url';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const packagePath = path.resolve(__dirname, '..', 'package.json');
const packageContent = await fs.readFile(packagePath, 'utf-8');

const runAction = async (fileName: string): Promise<void> => {
    const services = createELangServices(NodeFileSystem).ELang;
    const model = await extractAstNode<ELangProgram>(fileName, services);
    const interpreter = new Interpreter();
    try {
        interpreter.eval(model);
    } catch (e: any) {
        console.error(chalk.red('Runtime Error: ' + e.message));
        process.exit(1);
    }
};

export default function(): void {
    const program = new Command();

    program.version(JSON.parse(packageContent).version);

    // CLI Commands go here
    const fileExtensions = ELangLanguageMetaData.fileExtensions.join(', ');
    program
        .command('run')
        .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
        .description('Runs the provided source file.')
        .action(runAction);

    program.parse(process.argv);
}
