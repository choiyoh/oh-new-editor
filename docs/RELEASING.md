# Publishing the packages

Publishing is handled by Changesets in `.github/workflows/release.yml`. Building or running the package checks does not publish anything.

## Account preparation

The `@oh-new-editor` scope must belong to the publishing npm user or an organization that grants that user package publishing access. Confirm this before the first release; a package returning 404 does not establish ownership of its scope.

For the existing token-based workflow, create a granular npm token with publishing permission for this scope and the appropriate non-interactive publishing/2FA settings. Add it as the repository Actions secret `NPM_TOKEN`. Enter secret values through GitHub's secret UI or `gh secret set NPM_TOKEN`; never commit them to the repository. The workflow passes this secret as both `NPM_TOKEN` (Changesets) and `NODE_AUTH_TOKEN` (`setup-node` registry authentication).

For local account verification, use `pnpm login` and `pnpm whoami`. Interactive sign-in and account/organization permissions must be completed by the npm account owner.

In GitHub repository **Settings → Actions → General → Workflow permissions**, enable **Allow GitHub Actions to create and approve pull requests** so Changesets can open its release PR. The workflow grants only the contents and pull request permissions it needs.

Trusted publishing through OIDC can replace the token flow, but requires configuring each package's trusted publisher, compatible npm/Node versions, and `id-token: write` in the workflow. Do not remove the current token until that separate setup has been verified. See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) and [npm scoped public packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/).

## Validate the exact publishable files

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
pnpm build
node scripts/check-size.mjs
node scripts/check-packages.mjs
pnpm changeset status
```

The package check packs all four libraries, verifies README/license/export files and rewritten workspace peers, installs the tarballs in isolated consumers, and checks React 18/19, Vue 3, Svelte 5, server imports/rendering, and TypeScript declarations. It requires registry access for consumer dependencies. It runs in CI and in the release workflow.

## Release through Changesets

1. Merge the reviewed fixes and their Changeset into `main`.
2. The workflow creates a version/changelog PR. Review the versions and rerun the checks on that PR.
3. Merge the version PR when ready to publish. The workflow then publishes unpublished package versions.
4. Confirm the workflow succeeded and check the npm versions and dist-tags.

The current patch Changeset increments the libraries from `0.1.0` to `0.1.1`, including when this is their first public release. Changesets does not choose the first version based on whether the package is already in the registry. Avoid running the manual Release workflow on an unreviewed feature branch: it acts on the selected branch.

An npm version cannot be overwritten. If publishing partially succeeds, inspect the existing versions before retrying; Changesets skips versions already in the registry.
