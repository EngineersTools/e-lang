import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Determine bump type
let bumpType = 'patch';
if (process.argv.includes('--major')) bumpType = 'major';
else if (process.argv.includes('--minor')) bumpType = 'minor';
else if (process.argv.includes('--patch')) bumpType = 'patch';

// 2. Parse current version from root
const rootPkgPath = path.join(rootDir, 'package.json');
const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
let currentVersion = rootPkg.version;

if (!currentVersion) {
    console.error("Could not find a 'version' field in the root package.json");
    process.exit(1);
}

// 3. Compute new version
const parts = currentVersion.split('.').map(Number);
if (bumpType === 'major') {
    parts[0]++;
    parts[1] = 0;
    parts[2] = 0;
} else if (bumpType === 'minor') {
    parts[1]++;
    parts[2] = 0;
} else {
    parts[2]++;
}
const newVersion = parts.join('.');
console.log(`Updating version from ${currentVersion} to ${newVersion} (${bumpType} bump)...`);

// 4. Gather all package.json paths
const packagesDir = path.join(rootDir, 'packages');
const packageDirs = fs.readdirSync(packagesDir).filter(d => fs.statSync(path.join(packagesDir, d)).isDirectory());
const pkgPaths = [rootPkgPath, ...packageDirs.map(d => path.join(packagesDir, d, 'package.json'))];

// 5. Gather all package names in the workspace
const workspacePackageNames = new Set();
const pkgsData = [];
for (const pkgPath of pkgPaths) {
    if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg.name) {
            workspacePackageNames.add(pkg.name);
        }
        pkgsData.push({ path: pkgPath, data: pkg });
    }
}

// 6. Update versions and dependencies
for (const { path: pkgPath, data: pkg } of pkgsData) {
    pkg.version = newVersion;
    
    for (const depType of ['dependencies', 'devDependencies', 'peerDependencies']) {
        if (pkg[depType]) {
            for (const depName of Object.keys(pkg[depType])) {
                if (workspacePackageNames.has(depName)) {
                    const currentDepVersion = pkg[depType][depName];
                    // Update only if it's not a wildcard
                    if (currentDepVersion !== '*') {
                        pkg[depType][depName] = newVersion;
                    }
                }
            }
        }
    }
    
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 4) + '\n', 'utf8');
    console.log(`Updated ${path.relative(rootDir, pkgPath)}`);
}

console.log(`\nSuccessfully updated all packages to ${newVersion}.`);
console.log(`You can now commit these changes and publish to NPM and VSCode Marketplace.`);
