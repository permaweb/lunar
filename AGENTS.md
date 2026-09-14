# Agent instructions

## Required frontend architecture skill

- Before acting on every prompt in this repository, load and follow `$permaweb-frontend-code-style` from `.agents/skills/permaweb-frontend-code-style/SKILL.md`.
- Apply the skill to all inspection, planning, review, implementation, debugging, refactoring, testing, and migration work because Lunar is a permaweb frontend.
- Read the complete frontend conventions on every task. Also read the permaweb conventions whenever wallet, Arweave, AO, gateway, cache, service-worker, or deployment behavior is in scope.
- Keep `.permaweb-frontend.json` accurate, run the bundled architecture validator after frontend changes, and do not mark the repository compliant while mapped violations remain.
- During adoption, execute behavior-preserving migration slices instead of grandfathering existing violations. Preserve unrelated changes and keep product redesign out of structural migrations.

## Agent entry points

- The skill is vendor-neutral and lives only at `.agents/skills/permaweb-frontend-code-style/`. Make every edit there.
- **Claude Code** discovers it via `.claude/skills/permaweb-frontend-code-style`, a symlink into `.agents/`, and loads this file through `CLAUDE.md`. Recreate the link with `ln -sfn ../../.agents/skills/permaweb-frontend-code-style .claude/skills/permaweb-frontend-code-style`.
- **OpenAI/Codex** discovers it via `.agents/skills/permaweb-frontend-code-style/agents/openai.yaml` and loads this file directly.
- Per-vendor presentation metadata lives in `.agents/skills/permaweb-frontend-code-style/agents/`; keep `claude.yaml` and `openai.yaml` in step when the skill's name or prompt changes.

## Verification

- Run the architecture validator, TypeScript compiler, and relevant focused tests after frontend changes.
- Run a production build only when changes affect bundling, routes, lazy imports, dependencies, assets, or deployment paths.
- Run a development server only when visual or browser behavior requires it, and stop it when verification is complete.
