import path from 'node:path';

// Compiles the daemon's build (`packages/daemon/dist`, type-checked by `tsgo --build`) into one executable, named the
// way Tauri finds a sidecar (`bundle.externalBin` in `tauri.conf.json`): `<name>-<target triple>`, plus `.exe` on
// Windows. It is built for the machine it runs on; Tauri bundles the one matching the build's target.

/** The Rust target triple of each platform the app ships for, keyed by Bun's `<platform>-<arch>`. */
const TARGET_TRIPLES: Record<string, string> = {
    'darwin-arm64': 'aarch64-apple-darwin',
    'darwin-x64': 'x86_64-apple-darwin',
    'linux-arm64': 'aarch64-unknown-linux-gnu',
    'linux-x64': 'x86_64-unknown-linux-gnu',
    'win32-x64': 'x86_64-pc-windows-msvc',
};

const root = path.resolve(import.meta.dirname, '..');
const platform = `${process.platform}-${process.arch}`;
const triple = TARGET_TRIPLES[platform];
if (!triple) {
    throw new Error(`No sidecar target for ${platform}`);
}

const extension = process.platform === 'win32' ? '.exe' : '';
const outfile = path.join(root, 'packages/desktop/src-tauri/binaries', `poweragents-daemon-${triple}${extension}`);

const result = Bun.spawnSync(
    ['bun', 'build', '--compile', path.join(root, 'packages/daemon/dist/main.js'), '--outfile', outfile],
    { stdout: 'inherit', stderr: 'inherit' },
);
if (result.exitCode !== 0) {
    process.exit(result.exitCode ?? 1);
}
