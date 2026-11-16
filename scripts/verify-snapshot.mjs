import assert from 'node:assert/strict';
import { format } from 'prettier';
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import process from 'node:process';
const manifest = JSON.parse(await readFile('package.json', 'utf8'));
const lock = JSON.parse(await readFile('package-lock.json', 'utf8'));
const spec = manifest.dependencies['@unplan-tave/parser'];
const path = spec.slice(5);
const data = await readFile(path);
const sha256 = createHash('sha256').update(data).digest('hex');
const integrity = `sha512-${createHash('sha512').update(data).digest('base64')}`;
const installed = JSON.parse(
  await readFile('node_modules/@unplan-tave/parser/package.json', 'utf8'),
);
assert.equal(lock.packages[''].dependencies['@unplan-tave/parser'], spec);
assert.equal(lock.packages['node_modules/@unplan-tave/parser'].resolved, spec);
assert.equal(
  lock.packages['node_modules/@unplan-tave/parser'].integrity,
  integrity,
);
assert.equal(
  lock.packages['node_modules/@unplan-tave/parser'].version,
  installed.version,
);
assert.ok(path.includes(sha256.slice(0, 12)));
const packedManifest = JSON.parse(
  execFileSync('tar', ['-xOf', path, 'package/package.json'], {
    encoding: 'utf8',
  }),
);
assert.equal(packedManifest.version, installed.version);
const files = execFileSync('tar', ['-tzf', path], { encoding: 'utf8' })
  .trim()
  .split('\n');
assert.ok(
  files.every((f) =>
    /^package\/(?:dist\/|docs\/|README.md$|package.json$)/u.test(f),
  ),
);
const exports = Object.keys(await import('@unplan-tave/parser')).sort();
assert.deepEqual(exports, ['INITIAL_POLICIES', 'PARSER_INFO', 'parseSchedule']);
const build = {};
async function hashDirectory(directory) {
  for (const e of await readdir(directory, { withFileTypes: true })) {
    const p = `${directory}/${e.name}`;
    if (e.isDirectory()) await hashDirectory(p);
    else
      build[p] = createHash('sha256')
        .update(await readFile(p))
        .digest('hex');
  }
}
await hashDirectory('dist');
await mkdir('docs/evidence', { recursive: true });
const result = {
  package: installed.name,
  version: installed.version,
  vendor: path,
  sha256,
  integrity,
  files,
  exports,
  build,
};
await writeFile(
  process.env.SNAPSHOT_PATH ?? 'docs/evidence/conversation-snapshot.json',
  await format(JSON.stringify(result), { parser: 'json' }),
);
console.log(JSON.stringify(result, null, 2));
