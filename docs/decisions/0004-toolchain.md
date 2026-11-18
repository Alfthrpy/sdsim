# ADR 0004 — Code toolchain

- **Status:** proposed (ticket S-001, `review: human`)
- **Date:** 2026-11-18

## Decision

The toolchain in `docs/PLAN.md` section 5.3, as far as S-001 needs it: Node 24 (`.nvmrc`), TypeScript 6.0.3 (`strict`, `noUncheckedIndexedAccess`), npm workspaces with exact pins (`.npmrc` `save-exact`) and a committed lockfile, Vitest 5.1.0, ESLint 10.15.0 with typescript-eslint 8.72.2 and eslint-plugin-boundaries 7.4.4, Prettier 3.10.1. Vite, React, uPlot, Playwright, Ajv, fast-check, pure-rand and the rest come with the tickets that use them.

## What S-001 enforces

- `packages/engine`, `packages/components`, `packages/lab-runtime` compile with `lib: ES2023` and `types: []` (no DOM, no Node globals), and ESLint bans `Date`, `performance`, timers, `crypto`, `window`, `self`, `document`, `Math.random` and `for...in` there (PLAN 9.2). Checked with files that break each rule.
- Layer boundaries: engine <- components <- lab-runtime <- cli. `sandbox/` may import only package entry points (a boundaries policy plus `no-restricted-imports` on `packages/*/src/**`).
- CI (`.github/workflows/ci.yml`): `npm ci`, lint, Prettier check, typecheck, tests, plus ticket validation and the ticket-tool tests.

## Notes

- Prettier checks code and config only; Markdown, `backlog/` and `sessions/` are excluded so docs are not reformatted by tooling.
- `npm audit` reports one moderate advisory in `minimatch`, pulled in by typescript-eslint 8.72.2 (dev-only, lint time). The fix is typescript-eslint 8.73.0, outside the exact pin in PLAN 5.3; revisit in a dependency-update ticket.
- The workspace globs are `packages/*`. `sandbox/` and `apps/web` become workspaces when their tickets add a `package.json`.
- GitHub Actions minutes being free for a public repo (PLAN 5.2) is verified when the first PR's CI runs.
