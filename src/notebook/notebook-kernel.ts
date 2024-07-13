import { URI, UriUtils } from "langium";
import * as vscode from "vscode";
import { runInterpreter } from "../interpreter/interpreter.js";

export class ELangNotebookKernel {
  readonly id = "e-lang-kernel";
  public readonly label = "ELang Kernel";
  readonly supportedLanguages = ["e-lang"];

  private _executionOrder = 0;
  private readonly _controller: vscode.NotebookController;

  constructor() {
    this._controller = vscode.notebooks.createNotebookController(
      this.id,
      "e-lang-notebook",
      this.label
    );

    this._controller.supportedLanguages = this.supportedLanguages;
    this._controller.supportsExecutionOrder = true;
    this._controller.executeHandler = this._executeAll.bind(this);
  }

  dispose(): void {
    this._controller.dispose();
  }

  private async _executeAll(
    cells: vscode.NotebookCell[],
    _notebook: vscode.NotebookDocument,
    _controller: vscode.NotebookController
  ): Promise<void> {
    for (let cell of cells) {
      if (cell && cell.kind === vscode.NotebookCellKind.Code)
        await this._doExecution(cell);
    }
  }

  private async _doExecution(cell: vscode.NotebookCell): Promise<void> {
    const execution = this._controller.createNotebookCellExecution(cell);

    execution.executionOrder = ++this._executionOrder;
    execution.start(Date.now());

    const text = cell.document.getText();

    await execution.clearOutput();

    const log = async (value: unknown) => {
      if (typeof value == "string") {
        await execution.appendOutput(
          new vscode.NotebookCellOutput([
            vscode.NotebookCellOutputItem.text(value),
          ])
        );
      } else if (typeof value == "object") {
        await execution.appendOutput(
          new vscode.NotebookCellOutput([
            vscode.NotebookCellOutputItem.json(value, "application/javascript"),
          ])
        );
      }
    };

    try {
      const containerDocumentUri = cell.document.uri;
      const documentDirUri = UriUtils.dirname(containerDocumentUri);
      const notebookUri = UriUtils.resolvePath(
        documentDirUri,
        containerDocumentUri.path
      );
      const uri = URI.file(notebookUri.path);
      await runInterpreter(text, { log, uri: uri });
      execution.end(true, Date.now());
    } catch (err) {
      const errString = err instanceof Error ? err.message : String(err);
      const errName = err instanceof Error ? err.name : "e-lang error";
      await execution.appendOutput(
        new vscode.NotebookCellOutput([
          vscode.NotebookCellOutputItem.error({
            name: errName,
            message: errString,
          }),
        ])
      );
      execution.end(false, Date.now());
    }
  }
}
