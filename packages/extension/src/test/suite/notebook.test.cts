import * as vscode from 'vscode';
import * as assert from 'assert';
import * as path from 'path';

suite('Notebook Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Can open notebook', async () => {
        // In CJS, __dirname is available globally
        // We want /home/cjgb/Programming/e-lang/examples/Notebook.elnb
        const uri = vscode.Uri.file(path.resolve(__dirname, '../../../../../../examples/Notebook.elnb'));
        console.log('[TEST] Opening notebook at:', uri.fsPath);
        
		const doc = await vscode.workspace.openNotebookDocument(uri);
        console.log('[TEST] Notebook opened. Type:', doc.notebookType);
        
        assert.strictEqual(doc.notebookType, 'e-lang-notebook');
        console.log('[TEST] Assertions passed.');
	});
});