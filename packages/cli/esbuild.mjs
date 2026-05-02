import * as esbuild from 'esbuild';

const watch = process.argv.includes('--watch');

const ctx = await esbuild.context({
    entryPoints: ['src/main.ts'],
    outdir: 'out',
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'es2022',
    // We bundle the internal workspace packages but keep external NPM packages separate
    external: ['chalk', 'commander'],
    sourcemap: true,
});

if (watch) {
    await ctx.watch();
    console.log('Watching for changes...');
} else {
    await ctx.rebuild();
    console.log('Build succeeded.');
    ctx.dispose();
}
