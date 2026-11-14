import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const demoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const parserRoot = resolve(demoRoot, process.argv[2] ?? '../unplan-parser');
const manifest = JSON.parse(
  await readFile(join(parserRoot, 'package.json'), 'utf8'),
);
if (manifest.name !== '@unplan-tave/parser') {
  throw new Error(`Expected @unplan-tave/parser at ${parserRoot}`);
}

const temporaryDirectory = await mkdtemp(join(tmpdir(), 'unplan-parser-pack-'));
try {
  // prepack builds the real distribution. Never import the sibling source tree.
  execFileSync('npm', ['pack', '--pack-destination', temporaryDirectory], {
    cwd: parserRoot,
    stdio: 'inherit',
  });
  const archives = (await readdir(temporaryDirectory)).filter((name) =>
    name.endsWith('.tgz'),
  );
  if (archives.length !== 1)
    throw new Error('Expected exactly one packed archive.');
  const archive = join(temporaryDirectory, archives[0]);
  const hash = createHash('sha256')
    .update(await readFile(archive))
    .digest('hex')
    .slice(0, 12);
  const filename = `unplan-tave-parser-${manifest.version}-${hash}.tgz`;
  const vendorDirectory = join(demoRoot, 'vendor');
  await mkdir(vendorDirectory, { recursive: true });
  await copyFile(archive, join(vendorDirectory, filename));

  // Content-addressed filenames prevent stale lockfile integrity at one version.
  execFileSync(
    'npm',
    ['install', '--save-exact', '--ignore-scripts', `./vendor/${filename}`],
    { cwd: demoRoot, stdio: 'inherit' },
  );
  for (const old of await readdir(vendorDirectory)) {
    if (
      old.startsWith('unplan-tave-parser-') &&
      old.endsWith('.tgz') &&
      old !== filename
    ) {
      await rm(join(vendorDirectory, old));
    }
  }
  console.log(`Installed @unplan-tave/parser from vendor/${filename}`);
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
