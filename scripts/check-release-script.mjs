import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = await mkdtemp(join(tmpdir(), 'oh-editor-publish-test-'));
const log = join(directory, 'arguments.json');
const repo = fileURLToPath(new URL('../', import.meta.url));
const workflow = await readFile(new URL('../.github/workflows/release.yml', import.meta.url), 'utf8');
const commandLine = workflow.match(/^\s+publish:\s+(.+)$/m)?.[1];
assert.ok(commandLine, 'Release workflow must configure a publish command');
// Match the executable/arguments dispatch used by changesets/action. Shell
// operators become arguments here, so the previous && bug fails this check.
const [command, ...args] = commandLine.trim().split(/\s+/);
const executable = command === 'node' ? process.execPath : command;

try {
  // A local executable captures the dispatch; these tests never publish.
  await writeFile(join(directory, 'pnpm'), `#!/usr/bin/env node
import('node:fs').then(({ writeFileSync }) => {
  writeFileSync(process.env.PUBLISH_TEST_LOG, JSON.stringify(process.argv.slice(2)));
  process.exit(Number(process.env.PUBLISH_TEST_STATUS));
});
`, { mode: 0o755 });

  for (const [token, childStatus, expectedStatus, called] of [
    [undefined, 0, 1, false],
    ['XXXXX-placeholder', 0, 1, false],
    ['release-test-token', 0, 0, true],
    ['release-test-token', 42, 42, true],
  ]) {
    await rm(log, { force: true });
    const env = {
      ...process.env,
      PATH: `${directory}${delimiter}${process.env.PATH}`,
      PUBLISH_TEST_LOG: log,
      PUBLISH_TEST_STATUS: String(childStatus),
    };
    if (token === undefined) delete env.NODE_AUTH_TOKEN;
    else env.NODE_AUTH_TOKEN = token;
    const result = spawnSync(executable, args, { cwd: repo, env, encoding: 'utf8' });
    assert.equal(result.status, expectedStatus, result.stderr);
    if (called) {
      assert.deepEqual(JSON.parse(await readFile(log, 'utf8')), ['changeset', 'publish']);
    } else {
      await assert.rejects(readFile(log), { code: 'ENOENT' });
    }
  }
  console.log('Release command: auth gating, actual publish dispatch, and failure propagation OK (no packages published)');
} finally {
  await rm(directory, { recursive: true, force: true });
}
