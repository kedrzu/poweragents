import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Downloads the pinned Lima release into `packages/daemon/vendor/lima` for development: the daemon runs `limactl` from
// there (`POWERAGENTS_LIMA_DIR` overrides it). A release build bundles Lima into the app instead. Lima runs the sandbox
// only on macOS, so elsewhere this is a no-op; CI (Linux) never fetches it.

const LIMA_VERSION = '2.3.0';

/** sha256 of each release tarball, from the release's `SHA256SUMS`, keyed by Node's `process.arch`. */
const TARBALLS: Record<string, { arch: string; sha256: string }> = {
    arm64: { arch: 'arm64', sha256: 'b7af444bd8f91d3c307477e562f2cf3bd7595d62b9429185e4fa841563578cfc' },
    x64: { arch: 'x86_64', sha256: 'd58bc7d6b8158d638720d8c8fdb17eb58527dfead6a29a5b60f48a35ee4a65a6' },
};

const root = path.resolve(import.meta.dirname, '..');
const target = path.join(root, 'packages/daemon/vendor/lima');
const marker = path.join(target, '.version');

if (process.platform !== 'darwin') {
    console.log(`Lima is fetched only on macOS; skipping on ${process.platform}.`);
    process.exit(0);
}

const tarball = TARBALLS[process.arch];
if (!tarball) {
    throw new Error(`No Lima tarball for darwin-${process.arch}`);
}

const fileName = `lima-${LIMA_VERSION}-Darwin-${tarball.arch}.tar.gz`;
const installed = await readFile(marker, 'utf8').catch(() => null);
if (installed?.trim() === fileName) {
    console.log(`Lima ${LIMA_VERSION} is already in ${path.relative(root, target)}.`);
    process.exit(0);
}

const url = `https://github.com/lima-vm/lima/releases/download/v${LIMA_VERSION}/${fileName}`;
console.log(`Downloading ${url}`);
const response = await fetch(url);
if (!response.ok) {
    throw new Error(`Lima download failed: HTTP ${response.status}`);
}

const bytes = new Uint8Array(await response.arrayBuffer());
const sha256 = new Bun.CryptoHasher('sha256').update(bytes).digest('hex');
if (sha256 !== tarball.sha256) {
    throw new Error(`Lima tarball checksum mismatch: expected ${tarball.sha256}, got ${sha256}`);
}

// The marker goes last, so an interrupted run leaves no marker and the next run unpacks again.
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
const untar = Bun.spawnSync(['tar', '-xzf', '-', '-C', target], { stdin: bytes, stdout: 'inherit', stderr: 'inherit' });
if (untar.exitCode !== 0) {
    throw new Error(`Unpacking ${fileName} failed with exit code ${untar.exitCode}`);
}
await writeFile(marker, `${fileName}\n`);

console.log(`Lima ${LIMA_VERSION} installed in ${path.relative(root, target)}.`);
