# Frontend plugins

The HyperCommerce installer uses the Hyperlocal `plugin.json` and `instructions.json` format. A package can add Pages Router routes, assets, translations, dependencies, and managed edits to existing storefront source.

## Install and remove plugins

Run `npm ci` and configure the storefront environment as you would for a regular build. Extract each package to `plugins/<folder>/` so its `plugin.json` is directly inside that folder.

```sh
npm run plugins -- inspect ./plugins/example
npm run plugins:install -- --dry-run
npm run plugins:install -- example
npm run plugins:list
npm run plugins:uninstall -- example
npm run plugins:revert
```

- `plugins:install` without an ID discovers every package under `plugins/`. It applies new and changed packages and skips unchanged ones. An ID selects one package, and `./plugins/<folder>` selects an exact input directory.
- `plugins:uninstall` without an ID removes all installed contributions. It retains package inputs and local settings.
- `plugins:revert` restores the state before the most recent successful install or uninstall and consumes that revert point. Dry runs and unchanged installs preserve the point. Add `--dry-run` to preview any of these operations.
- `npm run plugins -- status` shows the selected profile and external state directory. Add `--json` after the npm separator for structured output.

The installer runs the existing `npm run build` in an isolated candidate before applying changes to the checkout. It uses `pages-export` by default and `pages-server` when `NEXT_PUBLIC_SSR=true`. Use `--profile pages-export` or `--profile pages-server` to select a profile explicitly. Keep the adjacent `<storefront>-plugin-state` directory for updates and recovery. Plugin installation is local. Publish an installed feature through the storefront's normal deployment workflow.

## Author a package

`plugins/example/plugin.json`

```json
{
  "id": "example",
  "version": "1.0.0",
  "instructions": "instructions.json",
  "contributions": {
    "routes": [{ "path": "/example", "entry": "src/Page.tsx" }]
  }
}
```

`plugins/example/instructions.json`

```json
{
  "schemaVersion": 1,
  "steps": [
    { "id": "files", "phase": "integrate", "action": "files.install" },
    { "id": "routes", "phase": "integrate", "action": "contributions.register", "dependsOn": ["files"] },
    { "id": "deps", "phase": "dependencies", "action": "dependencies.ensure" },
    { "id": "build", "phase": "build", "action": "command.run", "with": { "commandId": "host.build" } }
  ]
}
```

Add a default-exported page component in `src/Page.tsx` inside the package. The installer generates `src/pages/example/index.tsx`, pointing to `src/plugins/example/src/Page.tsx`. For a route requiring different data loading in each mode, set `contributions.routes[].adapters.pages-export` and `adapters.pages-server` with an `entry` and the named `exports` to forward. Exported dynamic routes use `getStaticPaths` with `getStaticProps`. Request-time routes use `getServerSideProps`.

| Instruction | Configuration and result |
| --- | --- |
| `files.install` | Copies package `src/` into `src/plugins/<id>/src/` and optional `assets/` into `public/plugins/<id>/`. Use `with.mappingRef` to select additional `fileMappings` declared in the manifest. |
| `files.append` | Use `with.rulesRef` or `with.rulesRefs` to select manifest `appendRules` documents. Each rule specifies its `id`, exact existing `target`, and inline `content` or package-relative `source`. Positions `before` and `after` require a literal anchor. Use `commentStyle: "jsx"` for JSX children. |
| `contributions.register` | Generates route wrappers and records contributions in `src/plugins/registry.json`. |
| `translations.merge` | Merges each manifest `contributions.translations` entry, with `locale` and `from` fields, under `plugin:<id>` in the matching storefront locale JSON. Read a label with `t("plugin:example.title", { nsSeparator: false })`. |
| `dependencies.ensure` | Merges a package's optional `dependencies` and `devDependencies` into the candidate. Versions already declared by the host or another package must match exactly. |
| `command.run` | Runs the host build or a named command declared by the host in `plugin-host.json`. |

Put operator overrides in root `plugin-config.local.json`, keyed by manifest ID. The installer writes `public` settings to the installed module's `config.json` and passes `installer` settings to custom commands. Keep credentials in the `installer` section. Packages can declare defaults, environment references, and required fields in `configuration.public` and `configuration.installer`.

When the panel supplies a `plugins` group in `/settings`, `getSpecificSettings(settings, "plugins")` returns its `{ name, enabled }` entries. The local installer tracks applied code through its own registry.

Commit package source in its own repository. The storefront pre-commit hook checks the staged index for package inputs, generated route and source integrations, plugin translations, and local settings. `npm ci` configures the tracked hook when the checkout uses the default hook path. For a custom hook path, call `npm run check:plugin-commit` from your pre-commit hook.

## Verify installer changes

From a storefront repository checkout, run `npm run test:plugins` and `npm run test:plugin-commits`. These suites install and remove fixtures in temporary projects.
