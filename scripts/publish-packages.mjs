import './check-publish-auth.mjs';
import { spawnSync } from 'node:child_process';

// Changesets invokes the publish input as an executable, without a shell.
// Keep authentication and publishing in one entrypoint and propagate failure.
const result = spawnSync('pnpm', ['changeset', 'publish'], { stdio: 'inherit' });
if (result.error) {
  console.error(`Could not start package publishing: ${result.error.message}`);
}
process.exit(result.status ?? 1);
