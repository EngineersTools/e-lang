import * as vscode from 'vscode';
import { Interpreter } from 'e-lang-interpreter';
import { createELangServices } from 'e-lang-language';
import { EmptyFileSystem, LangiumDocument } from 'langium';
import { ELangProgram } from 'e-lang-language';
import { URI } from 'vscode-uri';

export class ELangNotebookKernel {
    private readonly _id = 'e-lang-kernel';
    private readonly _label = 'E-Lang Kernel';
    private readonly _supportedLanguages = ['e-lang'];

    private _controller: vscode.NotebookController;
    private _interpreters: Map<vscode.NotebookDocument, Interpreter> = new Map();
    private _services;

    constructor() {
        this._controller = vscode.notebooks.createNotebookController(
            this._id,
            'e-lang-notebook',
            this._label
        );

        this._controller.supportedLanguages = this._supportedLanguages;
        this._controller.supportsExecutionOrder = true;
        this._controller.executeHandler = this._executeAll.bind(this);

        // Initialize Langium services for parsing
        // We use EmptyFileSystem because we deal with independent text documents
        const services = createELangServices(EmptyFileSystem);
        this._services = services.ELang;
    }

    dispose(): void {
        this._controller.dispose();
    }

    private _executeAll(
        cells: vscode.NotebookCell[],
        _notebook: vscode.NotebookDocument,
        _controller: vscode.NotebookController
    ): void {
        for (const cell of cells) {
            this._doExecution(cell);
        }
    }

    private async _doExecution(cell: vscode.NotebookCell): Promise<void> {
        const execution = this._controller.createNotebookCellExecution(cell);
        execution.executionOrder = cell.index;
        execution.start(Date.now());

        try {
            // Get or create interpreter for this notebook
            let interpreter = this._interpreters.get(cell.notebook);
            if (!interpreter) {
                interpreter = new Interpreter();
                this._interpreters.set(cell.notebook, interpreter);
            }

            // Parse the code using Langium services
            const document = this._services.shared.workspace.LangiumDocumentFactory.fromString<ELangProgram>(
                cell.document.getText(),
                URI.parse(cell.document.uri.toString() + ".elng")
            );
            
            await this._services.shared.workspace.DocumentBuilder.build([document]);

            // Capture console.log
            const originalLog = console.log;
            const outputs: vscode.NotebookCellOutputItem[] = [];
            
            console.log = (...args: any[]) => {
                const text = args.map(a => String(a)).join(' ');
                outputs.push(vscode.NotebookCellOutputItem.text(text));
            };

            // Execute
            let result: any;
            try {
                result = interpreter.eval(document as LangiumDocument<ELangProgram>);
            } finally {
                console.log = originalLog;
            }

            const cellOutputs: vscode.NotebookCellOutput[] = [];
            if (outputs.length > 0) {
                 // Combine stdout into one output for now? or multiple.
                 // Usually one stdout output item per block of logs.
                 // let's create one output from all logs
                 const allOutput = outputs.map(o => new TextDecoder().decode(o.data)).join('\n');
                 if(allOutput.trim().length > 0) {
                     cellOutputs.push(new vscode.NotebookCellOutput([vscode.NotebookCellOutputItem.text(allOutput)]));
                 }
            }

            if (result !== undefined) {
                cellOutputs.push(new vscode.NotebookCellOutput([
                    vscode.NotebookCellOutputItem.text(String(result))
                ]));
            }

            await execution.replaceOutput(cellOutputs);
            execution.end(true, Date.now());
        } catch (err: any) {
            execution.replaceOutput([
                new vscode.NotebookCellOutput([
                    vscode.NotebookCellOutputItem.error(err)
                ])
            ]);
            execution.end(false, Date.now());
        }
    }
}
