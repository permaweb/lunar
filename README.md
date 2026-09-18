# Lunar

Lunar is a network explorer for [Arweave](https://arweave.org) and [AO](https://ao.arweave.net). In this application you can search blocks, transactions, bundles, and wallets
alongside processes, messages, assignments, results, and token transfers.

Lunar is itself a permaweb application. It builds to static assets, runs entirely in the browser against public
gateways and AO nodes, and is published to Arweave.

**Live application:** [lunar.arweave.net](https://lunar.arweave.net)

## Contents

- [Features](#features)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Application state](#application-state)
- [Network configuration](#network-configuration)
- [Testing and verification](#testing-and-verification)
- [Code style and architecture contract](#code-style-and-architecture-contract)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [License](#license)

## Features

| View         | Route            | Purpose                                                                                                |
| ------------ | ---------------- | ------------------------------------------------------------------------------------------------------ |
| Network      | `#/`             | Weave size, transaction throughput, storage and message metrics for Arweave, AO mainnet, and legacynet |
| Blocks       | `#/blocks`       | Recent blocks with height-range filters, block headers, and per-block transaction lists                |
| Explorer     | `#/explorer`     | Unified inspector that classifies an identifier and opens the matching record                          |
| Transactions | `#/transactions` | Recent transactions, bundles, messages, and assignments with filters                                   |
| Addresses    | `#/addresses`    | The Arweave wallet list with balances and last-transaction links                                       |
| Nodes        | `#/nodes`        | Arweave peer discovery, geographic distribution, fork history, and per-node inspection                 |
| Console      | `#/aos`          | Owner-only AOS session for creating AO processes and evaluating Lua in the browser                     |
| GraphQL      | `#/graphql`      | Multi-tab playground with gateway selection, schema introspection, and generated query templates       |
| Docs         | `#/docs`         | In-application documentation covering the networks, the concepts, and each view                        |

Across those views Lunar provides:

- **Identifier resolution.** Global search and Explorer accept a 43-character transaction, data item, process,
  message, or wallet identifier, a decimal block height, or a 64-character block hash, and classify the record
  from its tags and metadata.
- **AO execution tracing.** Process state, source, message trees, dry-run reads, signed writes, and results.
- **Arweave node inspection.** Direct reads against an individual node's overview, mempool, miners, transactions,
  and chain forks, independent of any gateway index.
- **Wallet integration.** Connect [Wander](https://www.wander.app) or PermawebOS to view balances, manage an AO
  profile, and sign process interactions. Every read-only surface works without a wallet.
- **Workspace state.** Pinned explorer tabs, persisted query tabs, eight light and dark themes, and a configurable
  set of AO nodes with a live status indicator.

## Getting started

### Prerequisites

- **Node.js** `^18`, `^20`, or `>=22` (the Vite 6 support range; CI builds on 22.x)
- **npm** 9 or newer, as bundled with those Node.js releases (the lockfile is version 3)
- Optionally a browser wallet extension — Wander or PermawebOS — for the wallet, profile, and AOS surfaces

### Installation

```bash
npm install
```

The `ao.js` dependency is vendored at `vendor/ao.js-0.1.15.tgz` and installs from the repository, so no additional
registry configuration is required.

### Development server

```bash
npm run start:development
```

Vite serves the application at [http://localhost:3000](http://localhost:3000) with `strictPort` enabled, so the
port is not silently reassigned. Change it in `vite.config.ts` if 3000 is already in use.

Lunar uses hash routing (`/#/explorer/...`), which lets the same build run from a gateway path, an ArNS name, or
the local file system without server-side rewrites. Service worker registration is skipped on `localhost`, so a
development session never serves a cached shell.

## Scripts

| Script                          | Description                                                                |
| ------------------------------- | -------------------------------------------------------------------------- |
| `npm run start:development`     | Start the Vite development server on port 3000                             |
| `npm run start:staging`         | Start the same server under the staging name                               |
| `npm run build`                 | Produce the production bundle in `dist/`                                   |
| `npm run typecheck`             | Run the TypeScript compiler with `--noEmit`                                |
| `npm run lint`                  | Run ESLint across the repository                                           |
| `npm run format`                | Apply ESLint fixes, then Prettier                                          |
| `npm run format:check`          | Verify formatting without writing                                          |
| `npm test`                      | Run the full Vitest suite once                                             |
| `npm run test:watch`            | Run Vitest in watch mode                                                   |
| `npm run test:coverage`         | Run the suite with V8 coverage                                             |
| `npm run test:verbose`          | Run the suite with the verbose reporter                                    |
| `npm run validate:architecture` | Enforce the frontend architecture contract                                 |
| `npm run validate:performance`  | Check the production output against the configured budgets                 |
| `npm run deploy:main`           | Build and publish to Arweave under the `lunar` name                        |
| `npm run clean:install`         | Remove `node_modules` and the lockfile, clear the npm cache, and reinstall |

## Project structure

```text
src/
├── api/            Typed adapters for every gateway, AO node, wallet, and network boundary
├── app/            Application shell, routing, and global styles
├── components/
│   ├── atoms/      Primitive controls: buttons, inputs, selects, loaders, modals, links
│   ├── molecules/  Reusable compositions: lists, tables, editors, viewers, search
│   └── organisms/  Stateful sections: AOS, GraphQL playground, process editor and source
├── features/       Domain-owned UI, hooks, and models (Addresses, Explorer, Mining, Nodes, Pins, Profiles)
├── helpers/        Pure utilities, configuration, themes, types, and validation
├── hooks/          Reusable React behavior
├── navigation/     Application shell navigation: header, sidebar, docs navigation, and footer
├── providers/      Shared context: settings, wallet, permaweb APIs, language, notifications, profile, pins
├── store/          Redux store and the persisted transaction cache
├── views/          Route orchestration, one directory per route
├── wallet/         Wallet connection surfaces
└── wrappers/       Cross-cutting behavioral wrappers

tests/              Every automated test and test-only artifact, mirroring the source tree
public/             Static assets, the web manifest, and the service worker
```

Each component lives in its own PascalCase directory containing `ComponentName.tsx`, `styles.ts`, and an
`index.ts` barrel. Imports flow toward lower-level capabilities: views compose navigation, features, and shared
components; features and components consume hooks, providers, and API contracts; `src/api` depends only on other
API modules, pure helpers, and application-owned types, and never on React or presentation code.

Path aliases are configured in `vite.config.ts`, `vitest.config.ts`, and `tsconfig.json`, so modules are imported
as `api/http`, `components/atoms/Button`, `features/Explorer`, `helpers/config`, `navigation/Footer`,
`providers/SettingsProvider`, `store`, and `views/Explorer` rather than by relative path across layers.

## Application state

- **Providers** (`src/providers/`) own shared application state: user settings, wallet connection, permaweb API
  clients, language, notifications, AO profile, and pinned tabs. They consume typed contracts from `src/api/`
  rather than SDKs directly.
- **Redux** (`src/store/`) with `redux-persist` over IndexedDB backs the transaction cache, which is pruned on
  startup so stale records do not accumulate.
- **Settings** persist locally and cover theme, sidebar state, node status visibility, and the configured AO node
  list. A version marker in `src/app/App.tsx` clears the IndexedDB cache when the application version changes.

## Network configuration

Infrastructure values live in `src/helpers/config.ts`:

- `DEFAULT_AO_NODE` and `DEFAULT_AO_PEERS` — the AO mainnet node and peers used until a user configures their own
  under **Network Settings** in the application
- `DEFAULT_GRAPHQL_ENDPOINT` — the GraphQL endpoint every query outside the GraphQL page uses until a user sets their
  own under **Network Settings → GraphQL Endpoint**; it is also the GraphQL page's default gateway
- `PROCESSES` — the AO processes read for token and metrics data
- `DEPLOYMENT` — the `lunar` name token whose state carries the published deployment transaction shown in the footer
- `STYLING`, `URLS`, and `LINKS` — layout tokens, routes, and external links

All network access is confined to adapters under `src/api/`. Components, views, hooks, and providers consume the
application-owned contracts those adapters expose, so a gateway, node, or SDK can be replaced without touching UI
code.

## Testing and verification

Tests live under the top-level `tests/` directory, mirroring the source tree, and never beside production source.
The suite runs on Vitest with a Node environment by default; component tests opt into jsdom with a
`// @vitest-environment jsdom` pragma and render through `react-dom/client`.

```bash
npm test                        # full suite
npx vitest run tests/api        # a directory
npx vitest run tests/navigation/Footer/Footer.test.tsx
```

Coverage includes adapter contract and error-mapping tests, feature behavior tests, accessibility checks with
`axe-core`, and property-based tests with `fast-check` for identifier and parsing logic.

Before opening a pull request:

```bash
npm run validate:architecture
npm run typecheck
npm test
```

Run `npm run build` followed by `npm run validate:performance` when a change affects bundling, routes, lazy
imports, dependencies, assets, or deployment paths.

## Code style and architecture contract

`AGENTS.md` is the shared contract for this repository and applies to every contributor and coding agent. It is
backed by a vendor-neutral skill in `.agents/skills/permaweb-frontend-code-style/`, which documents the frontend
and permaweb conventions in full and ships the validator invoked by `npm run validate:architecture`.
`.permaweb-frontend.json` records the adoption status and the performance budgets.

Day-to-day conventions:

- Tabs, single quotes, semicolons, and a 120-character line limit, enforced by Prettier
- Sorted import groups enforced by `eslint-plugin-simple-import-sort`
- `import React from 'react'` with hooks and types accessed through the namespace
- Props accessed through `props.name` without destructuring; callback props named `on...` and handlers `handle...`
- Styled-components in a colocated `styles.ts`, imported as `import * as S from './styles'`
- A Husky pre-commit hook formats staged files automatically

## Deployment

```bash
npm run deploy:main
```

The script builds the application and publishes `dist/` with
[`@permaweb/deploy`](https://github.com/permaweb/permaweb-deploy), uploading through Turbo and updating the
`lunar` name so the published manifest transaction becomes the current deployment. Authentication uses a
base64-encoded Arweave JWK in the `DEPLOY_KEY` environment variable:

```bash
export DEPLOY_KEY=$(base64 -i wallet.json)
```

`.github/workflows/deploy.yaml` runs this on every push to `main` using the repository's `DEPLOY_KEY` secret.

Because the output must run from immutable static assets, the build uses a relative base (`base: './'`) and hash
routing. `public/service-worker.js` caches the shell and is registered only outside `localhost`; the cache is
invalidated when the resolved deployment changes.

## Documentation

The application ships its own documentation at [`/#/docs`](https://lunar.arweave.net/#/docs), sourced from
Markdown in `src/views/Docs/DocsDetail/MD/`. It covers the Arweave and AO overviews, core concepts such as
processes, messages, and AOS, a guide to wallets, and a reference for each view.

## License

ISC
