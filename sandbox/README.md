# sandbox

The owner's own scenarios and components written outside the packages (ADR 0003 #7, gate G4). Code here may import only the public entry points of `@sdsim/engine`, `@sdsim/components` and `@sdsim/cli`; the packages never import from here. ESLint enforces the boundary (`eslint.config.js`).
