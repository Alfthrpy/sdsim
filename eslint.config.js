import js from "@eslint/js";
import boundaries from "eslint-plugin-boundaries";
import tseslint from "typescript-eslint";

// Engine purity (PLAN 9.2): applies to the packages that run inside the simulation.
const pure = [
  "packages/engine/src/**",
  "packages/components/src/**",
  "packages/lab-runtime/src/**",
];

export default tseslint.config(
  { ignores: ["**/dist/**", "**/node_modules/**", "coverage/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: pure,
    rules: {
      "no-restricted-globals": [
        "error",
        ...[
          "Date",
          "performance",
          "setTimeout",
          "setInterval",
          "crypto",
          "window",
          "self",
          "document",
        ].map((name) => ({
          name,
          message: "The engine is pure: no wall clock, DOM or global state.",
        })),
      ],
      "no-restricted-properties": [
        "error",
        { object: "Math", property: "random", message: "Use a seeded RNG stream." },
        ...[
          "log",
          "log2",
          "log10",
          "log1p",
          "exp",
          "expm1",
          "pow",
          "sin",
          "cos",
          "tan",
          "asin",
          "acos",
          "atan",
          "atan2",
          "sinh",
          "cosh",
          "tanh",
          "asinh",
          "acosh",
          "atanh",
          "cbrt",
          "hypot",
        ].map((property) => ({
          object: "Math",
          property,
          message:
            "Not bit-identical across V8 versions (Node vs Chromium): use rng/log.ts or basic arithmetic.",
        })),
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "ForInStatement",
          message: "No for...in: iteration order must depend only on inputs.",
        },
      ],
    },
  },
  {
    // Sandbox may use public entry points only (ADR 0003 #8): no deep imports into package sources.
    files: ["sandbox/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/packages/*/src/**", "**/packages/*/test/**"],
              message: "Import the package entry point.",
            },
          ],
        },
      ],
    },
  },
  {
    // Layer boundaries: L1 engine <- L1' components <- L2 lab-runtime <- L2' cli; sandbox uses public entry points only.
    plugins: { boundaries },
    settings: {
      "boundaries/elements": [
        { type: "engine", pattern: "packages/engine/**" },
        { type: "components", pattern: "packages/components/**" },
        { type: "lab-runtime", pattern: "packages/lab-runtime/**" },
        { type: "cli", pattern: "packages/cli/**" },
        { type: "sandbox", pattern: "sandbox/**" },
      ],
    },
    files: ["packages/**/src/**", "sandbox/**"],
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: [
            {
              from: { element: { type: "engine" } },
              allow: { to: { element: { type: "engine" } } },
            },
            {
              from: { element: { type: "components" } },
              allow: { to: { element: { type: ["engine", "components"] } } },
            },
            {
              from: { element: { type: "lab-runtime" } },
              allow: { to: { element: { type: ["engine", "components", "lab-runtime"] } } },
            },
            {
              from: { element: { type: "cli" } },
              allow: { to: { element: { type: ["engine", "components", "lab-runtime", "cli"] } } },
            },
            {
              from: { element: { type: "sandbox" } },
              allow: { to: { element: { type: ["engine", "components", "cli", "sandbox"] } } },
            },
          ],
        },
      ],
    },
  },
);
