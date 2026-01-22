import * as vscode from 'vscode';


interface RawNotebookCell {
    languageId: string;
    content: string;
    kind: vscode.NotebookCellKind;
}

export class ELangNotebookSerializer implements vscode.NotebookSerializer {
    private readonly _output: vscode.OutputChannel;

    constructor(output: vscode.OutputChannel) {
        this._output = output;
    }

	deserializeNotebook(
		content: Uint8Array,
		_token: vscode.CancellationToken
	): vscode.NotebookData | Thenable<vscode.NotebookData> {
        this._output.appendLine('[Serializer] deserializeNotebook called');
		const contents = new TextDecoder().decode(content);
		let raw: RawNotebookCell[] = [];
		try {
			raw = <RawNotebookCell[]>JSON.parse(contents);
            if (!Array.isArray(raw)) {
                raw = [];
            }
		} catch {
			raw = [];
		}

		const cells = raw.map(
			item =>
				new vscode.NotebookCellData(
					item.kind !== undefined ? item.kind : vscode.NotebookCellKind.Code,
					item.content || '',
					item.languageId || 'e-lang'
				)
		);

		return new vscode.NotebookData(cells);
	}

    serializeNotebook(
        data: vscode.NotebookData,
        _token: vscode.CancellationToken
    ): Uint8Array | Thenable<Uint8Array> {
        const contents: RawNotebookCell[] = data.cells.map(cell => ({
            kind: cell.kind,
            languageId: cell.languageId,
            content: cell.value,
        }));

        return new TextEncoder().encode(JSON.stringify(contents, null, 2));
    }
}
