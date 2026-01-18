import { Interpreter } from 'e-lang-interpreter';
import { createELangServices, ELangProgram } from 'e-lang-language';
import { EmptyFileSystem, LangiumDocument } from 'langium';
import * as vscode from 'vscode';
import { URI } from 'vscode-uri';

export class ELangNotebookKernel {
    private readonly _id = 'e-lang-kernel';
    private readonly _label = 'E-Lang Kernel';
    private readonly _supportedLanguages = ['e-lang'];

    private _controller: vscode.NotebookController;
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

        // Explicitly set execution priority to ensure this kernel is preferred
        this._controller.description = 'E-Lang Notebook Kernel';

        // Initialize Langium services for parsing
        // We use EmptyFileSystem because we deal with independent text documents
        const services = createELangServices(EmptyFileSystem);
        this._services = services.ELang;
    }

    dispose(): void {
        this._controller.dispose();
    }

    getController(): vscode.NotebookController {
        return this._controller;
    }

    private async _executeAll(
        cells: vscode.NotebookCell[],
        _notebook: vscode.NotebookDocument,
        _controller: vscode.NotebookController
    ): Promise<void> {
        for (const cell of cells) {
            await this._doExecution(cell);
        }
    }

    private async _doExecution(cell: vscode.NotebookCell): Promise<void> {
        const execution = this._controller.createNotebookCellExecution(cell);
        execution.executionOrder = cell.index;
        execution.start(Date.now());

        try {
            // Collect outputs for this cell execution
            const cellOutputs: string[] = [];

            // Create a fresh interpreter for each cell execution with a custom logger
            // that captures outputs to cellOutputs
            const customLogger = (value: any) => {
                const text = String(value);
                cellOutputs.push(text);
            };
            
            const interpreter = new Interpreter(customLogger);

            // Parse the code using Langium services
            // Create a URI with .elng extension for Langium parsing
            const notebookUri = URI.parse(cell.document.uri.toString());
            const cellUri = notebookUri.with({ path: notebookUri.path.replace(/\.elnb$/, '') + '.elng' });
            
            const document = this._services.shared.workspace.LangiumDocumentFactory.fromString<ELangProgram>(
                cell.document.getText(),
                cellUri
            );
            
            await this._services.shared.workspace.DocumentBuilder.build([document]);

            // Execute
            let result: any;
            try {
                result = await interpreter.eval(document as LangiumDocument<ELangProgram>);
            } catch (e) {
                console.error('[Kernel] Eval failed:', e);
                throw e;
            }

            const notebookCellOutputs: vscode.NotebookCellOutput[] = [];
            if (cellOutputs.length > 0) {
                 const allOutput = cellOutputs.join('\n');
                 if(allOutput.trim().length > 0) {
                     notebookCellOutputs.push(new vscode.NotebookCellOutput([vscode.NotebookCellOutputItem.text(allOutput)]));
                 }
            }

            if (result !== undefined) {
                notebookCellOutputs.push(new vscode.NotebookCellOutput([
                    vscode.NotebookCellOutputItem.text(String(result))
                ]));
            }

            await execution.replaceOutput(notebookCellOutputs);
            execution.end(true, Date.now());
        } catch (err: any) {
            console.error('[Kernel] Execution error:', err);
            execution.replaceOutput([
                new vscode.NotebookCellOutput([
                    vscode.NotebookCellOutputItem.error(err)
                ])
            ]);
            execution.end(false, Date.now());
        }
    }
}
