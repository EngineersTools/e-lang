import * as vscode from 'vscode';
import * as assert from 'assert';
import * as path from 'path';

suite('Notebook Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Can open and execute notebook', async () => {
        // In CJS, __dirname is available globally
        // We want /home/cjgb/Programming/e-lang/examples/Notebook.elnb
        const uri = vscode.Uri.file(path.resolve(__dirname, '../../../../../../examples/Notebook.elnb'));
        console.log('[TEST] Opening notebook at:', uri.fsPath);
        
		const doc = await vscode.workspace.openNotebookDocument(uri);
        console.log('[TEST] Notebook opened. Type:', doc.notebookType);
        
        assert.strictEqual(doc.notebookType, 'e-lang-notebook');

        // FORCE UI TO LOAD: This triggers the webview/ServiceWorker logic
        console.log('[TEST] Showing notebook document...');
        await vscode.window.showNotebookDocument(doc);
        console.log('[TEST] Notebook editor shown.');

        // Wait for connection to settle (kernel loading is async)
        console.log('[TEST] Waiting for kernel load...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Execute the first cell
        const cell = doc.cellAt(0);
        console.log('[TEST] Executing cell 0 with content:', cell.document.getText());
        
        // Find our controller
        console.log('[TEST] Finding controller...');
        // Note: In integration tests, we might need to explicitly select the kernel if multiple exist, 
        // but here we hope ours is default or available.
        // We can look at vscode.notebooks
        
        // Trigger execution via command or API
        // simpler: vscode.commands.executeCommand('notebook.cell.execute')?
        // But let's verify via workspace edit or similar? 
        // Best is to use `vscode.commands.executeCommand('notebook.execute')`
        
        await vscode.commands.executeCommand('notebook.execute');
        console.log('[TEST] Execution command sent.');
        
        // Wait for output?
        // This notebook prints 10.
        // We loop and check outputs?
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check outputs
        console.log('[TEST] Checking outputs...');
        assert.strictEqual(cell.outputs.length, 1, 'Cell should have 1 output');
        const output = cell.outputs[0];
        assert.strictEqual(output.items.length, 1, 'Output should have 1 item');
        const rawText = new TextDecoder().decode(output.items[0].data);
        // Strip ANSI codes and trim
        const text = rawText.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '').trim();
        
        console.log('[TEST] Cleaned output text:', text);
        // Relaxed check: The kernel might output banners or other info.
        // We ensure our result is present.
        assert.ok(text.includes('10'), 'Output should contain "10"');

        console.log('[TEST] Saving notebook...');
        const saved = await doc.save();
        console.log('[TEST] Notebook saved:', saved);
        assert.ok(saved, 'Notebook should be saved successfully');

        console.log('[TEST] Test finished.');
	});
});