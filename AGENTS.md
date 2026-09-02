# Agent instructions

## Required frontend architecture skill

- Before acting on every prompt in this repository, load and follow `$permaweb-frontend-code-style` from `.agents/skills/permaweb-frontend-code-style/SKILL.md`.
- Apply the skill to all inspection, planning, review, implementation, debugging, refactoring, testing, and migration work because Lunar is a permaweb frontend.
- Read the complete frontend conventions on every task. Also read the permaweb conventions whenever wallet, Arweave, AO, gateway, cache, service-worker, or deployment behavior is in scope.
- Keep `.permaweb-frontend.json` accurate, run the bundled architecture validator after frontend changes, and do not mark the repository compliant while mapped violations remain.
- During adoption, execute behavior-preserving migration slices instead of grandfathering existing violations. Preserve unrelated changes and keep product redesign out of structural migrations.

## Verification

- Run the architecture validator, TypeScript compiler, and relevant focused tests after frontend changes.
- Run a production build only when changes affect bundling, routes, lazy imports, dependencies, assets, or deployment paths.
- Run a development server only when visual or browser behavior requires it, and stop it when verification is complete.
