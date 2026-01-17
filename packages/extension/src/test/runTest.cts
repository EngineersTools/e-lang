import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
	try {
        // In CJS, __dirname is available globally
        // const __filename = fileURLToPath(import.meta.url);
        // const __dirname = path.dirname(__filename);

		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, '../../../');

		// The path to test runner
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, './suite/index.cjs');

		// Download VS Code, unzip it and run the integration test
		await runTests({ 
            extensionDevelopmentPath, 
            extensionTestsPath 
        });
	} catch (err) {
		console.error('Failed to run tests', err);
		process.exit(1);
	}
}

main();
