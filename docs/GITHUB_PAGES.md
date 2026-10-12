# Demo site on GitHub Pages

The demo, landing page, and documentation are built from `apps/website`. The Pages workflow builds its upstream core package through Turbo, uploads only `apps/website/dist`, and deploys through the `github-pages` environment.

GitHub Pages must be enabled with **Source: GitHub Actions** in the repository's Pages settings. Public repositories support Pages on GitHub Free; private repositories require a compatible paid GitHub plan. Enabling website hosting does not change repository visibility.

For a project site, the Pages metadata supplies the deployment directory (for example `/oh-new-editor/`). Vite receives `VITE_BASE_PATH`, and `VITE_ROUTE_MODE=hash` keeps shared document links and refreshes on the static site's entry page:

```text
https://choiyoh.github.io/oh-new-editor/
https://choiyoh.github.io/oh-new-editor/#demo
https://choiyoh.github.io/oh-new-editor/#/docs/overview
```

The URL shown by the deployment is authoritative, especially when a custom domain is configured. Local development retains ordinary `/docs/...` history routes.

To validate a project-site build locally:

```sh
VITE_BASE_PATH=/oh-new-editor/ VITE_ROUTE_MODE=hash pnpm build --filter=@oh-new-editor/website
pnpm --filter @oh-new-editor/website test
```

The workflow runs on relevant changes to `main` and can also be started manually from Actions. It does not publish npm packages. See [GitHub Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
