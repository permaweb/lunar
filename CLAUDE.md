# Claude instructions

The shared agent contract for this repository lives in `AGENTS.md`. It is the single source of
truth for every agent, regardless of vendor. Read it first and follow it in full.

@AGENTS.md

## Claude-specific wiring

- `permaweb-frontend-code-style` is exposed to Claude Code through `.claude/skills/permaweb-frontend-code-style`,
  a symlink to `.agents/skills/permaweb-frontend-code-style`. Edit the skill only under `.agents/`
  so every agent stays in sync.
- Invoke it with the Skill tool (`permaweb-frontend-code-style`) or `/permaweb-frontend-code-style`
  before any frontend inspection, planning, review, implementation, debugging, refactoring, testing,
  or migration work in this repository.
- Read `.agents/skills/permaweb-frontend-code-style/references/frontend-conventions.md` on every task,
  and `references/permaweb-conventions.md` whenever wallet, Arweave, AO, gateway, cache,
  service-worker, or deployment behavior is in scope.
- Run `node .agents/skills/permaweb-frontend-code-style/scripts/validate_frontend_architecture.mjs`
  after frontend changes, alongside the TypeScript compiler and relevant focused tests.
