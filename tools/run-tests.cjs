// Run from either the repository root or npm --prefix tools. No test omissions.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const tests = fs.readdirSync(__dirname).filter(name => /^test-.*\.cjs$/.test(name)).sort();
for (const args of [
  ['--check', 'app/src/main/assets/facebook.js'],
  ['--check', 'app/src/main/assets/reference-engines.js'],
  ...tests.map(name => [path.join('tools', name)])
]) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(`${tests.length} DOM suites passed on ${process.version}.`);
