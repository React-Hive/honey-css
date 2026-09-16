# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

`@react-hive/honey-css` — a dependency-light CSS tokenizer and **structural** parser that produces a
small, predictable AST. It is a building block for CSS-in-JS compilers and transformation pipelines,
deliberately *not* a spec-complete CSS implementation.

Key consequence: the library parses **structure, not semantics**. It does not validate properties,
values, or at-rule grammars, and it never normalizes the AST during parsing. Keep it that way — when
adding a feature, ask whether it belongs in the parser or in a downstream transform.

## Commands

```bash
pnpm test              # vitest, single run (watch is disabled in vitest.config.ts)
pnpm build             # webpack -> dist/ (ESM + CJS + dev CJS + .d.ts)
pnpm clean             # rm -rf dist coverage
```

Run a single file or test: `pnpm test src/__tests__/tokenize-css.spec.ts` / `pnpm test -t "name"`.

There is an `eslint.config.mjs` (typescript-eslint `strict`) but **no lint script** — invoke ESLint
directly if needed. Prettier config: no semicolon-free style; `printWidth: 100`, single quotes,
`arrowParens: avoid`.

Requires Node >= 24, pnpm.

## Pipeline

Everything flows through one direction. Understanding this order explains most of the codebase:

```
raw CSS string
  └─ tokenizeCss            → HoneyCssToken[]          (single-pass lexer, never throws)
      └─ createCssTokenCursor → HoneyTokenCursor       (peek/next/mark/reset/expect/readUntil)
          └─ parseCssNodes   → HoneyCssAstNode[]       (recursive-descent grammar loop)
              ├─ parseCssAtRule      (@…)
              ├─ parseCssDeclaration (prop: value)
              └─ parseCssRule → parseCssBlock → parseCssNodes   (recursion)

AST consumers (independent of the parser):
  flattenCssRules  → nested AST → flat AST (resolves nesting via resolveCssSelector)
  stringifyCss     → AST → compact CSS string
```

`parseCss` is the public entry point that wires tokenizer → cursor → `parseCssNodes`.

## Module map (`src/`)

| Layer | Files |
| --- | --- |
| Lexing | `tokenize-css.ts` |
| Navigation | `create-css-token-cursor.ts` |
| Readers (no AST) | `read-css-selector.ts`, `read-css-key-or-selector.ts` |
| Parsers (AST) | `parse-css.ts`, `parse-css-nodes.ts`, `parse-css-rule.ts`, `parse-css-block.ts`, `parse-css-declaration.ts`, `parse-css-at-rule.ts` |
| AST transforms | `flatten-css-rules.ts`, `resolve-css-selector.ts`, `stringify-css.ts` |
| Types | `types.ts` |

`parse-css-nodes.ts` is the grammar's center: it resolves the core ambiguity between
`selector { … }`, `prop: value;`, and `@rule …`, and it is shared by both root-level and block-level
parsing via the `stopAtBraceClose` option.

## Invariants — do not break these

- **The tokenizer never throws.** Unterminated strings and comments degrade gracefully, and the main
  loop has a fallback index increment to guarantee forward progress. Preserve both properties.
- **`cursor.expect()` is the only throwing path** (via `assert` from `@react-hive/honey-utils`).
  Error messages are prefixed `[@react-hive/honey-css]:`.
- **`parseCssNodes` recovers rather than throws.** Unknown tokens are skipped; stray semicolons are
  ignored. Every branch must consume at least one token or the parser can spin.
- **At-rule `body` encodes the form**, and downstream code depends on it:
  - `null` → directive at-rule (`@import url("x");`)
  - `[]` → explicitly empty block (`@media (…) {}`)
  - `params: undefined` → no params at all
- **`stringifyCss` prunes but never rewrites.** Empty declarations, empty rules, and empty *block*
  at-rules are dropped; directive at-rules always survive. Output is compact (no whitespace) and
  deterministic.
- **`flattenCssRules` only descends into selector-context at-rules** — `@media`, `@supports`,
  `@container`, `@layer` (`SELECTOR_CONTEXT_AT_RULES`). Anything else, notably `@keyframes`, is
  passed through untouched, because flattening percentage "selectors" would corrupt them. Add a name
  to that map only if its body genuinely lives in the parent's selector scope.
- **`readUntil` spacing rule:** a space is inserted only between *consecutive `text` tokens*.
  `params` and `string` tokens are concatenated with no separator, so `var` + `(--x)` rebuilds as
  `var(--x)`. Changing this silently corrupts declaration values.
- **`readCssKeyOrSelector` backtracks.** It speculatively runs `readCssSelector`, accepts the result
  only if a `{` follows, and otherwise `reset`s the cursor and re-reads as a declaration key. Use
  `mark`/`reset` for any new speculative parse.
- Parsing is **non-destructive**: no selector resolution, no empty-node filtering, no normalization.
  Those belong in `flattenCssRules` / `stringifyCss` / consumer code.

## Deliberate extensions beyond standard CSS

These are features, not bugs — don't "fix" them:

- JS-style single-line comments (`// …`) are skipped by the tokenizer alongside `/* … */`.
- Nesting (`&:hover`, `& + &`) and arbitrary custom at-rules (`@honey-media`, …) are supported
  structurally, with no allow-list of at-rule names.
- Functional at-rule headers without whitespace (`@media(max-width: 600px)`) and multi-part headers
  (`@scope (.card) to (.title)`) parse correctly — see `parseAtRuleHeader`.
- Known limitation, intentional: `a:hover: 1;` parses as a declaration with key `a`. Documented in
  `read-css-key-or-selector.ts`.

## Conventions

- **One public function per file**, file name is the kebab-case of the export
  (`parse-css-at-rule.ts` → `parseCssAtRule`). Private helpers stay unexported in the same file.
- Every new module must be re-exported from `src/index.ts` — that file is the entire public surface.
- Arrow-function consts with explicit return types; `import type` for type-only imports.
- **JSDoc is part of the deliverable.** Existing modules carry long-form docs with CSS examples,
  behavior notes, and `{@link}` cross-references; new code is expected to match that density.
- Types are prefixed `HoneyCss*` (`HoneyCssToken`, `HoneyCssAstRuleNode`, …); the cursor interface is
  `HoneyTokenCursor`. Token and AST unions are discriminated on `type` for safe narrowing.
- Runtime dependencies are intentionally minimal: `@react-hive/honey-utils` (only `assert`) and
  `csstype` (types only). Do not add more without a strong reason.

## Tests

- Location: `src/__tests__/<module>.spec.ts`, one spec per source module.
- **Vitest globals are enabled** (`globals: true` + `types: ["vitest/globals"]`) — do not import
  `describe`/`it`/`expect`.
- Suite naming: `describe('[functionName]: what it does', …)`, cases as `it('should …')`.
- Assert whole structures with `toStrictEqual` against AST literals rather than spot-checking fields.
- AST-heavy specs define local `decl()` / `rule()` / `at()` builders — see
  `flatten-css-rules.spec.ts`.
- New behavior needs a spec; the suite is the de facto specification of the grammar.

## Build & release

- `webpack.config.mjs` emits three bundles from `src/index.ts`: `dist/index.mjs` (ESM),
  `dist/index.cjs` (CJS), `dist/index.dev.cjs` (development CJS), plus source maps. `README.md` and
  `LICENSE` are copied into `dist/`.
- Type declarations come from `tsconfig.build.json`, which extends `tsconfig.json` and excludes
  `__tests__`.
- `prepublishOnly` runs `clean && test && build` — a failing test blocks publish.
- **Publishing is triggered by pushing to the `release` branch** (`.github/workflows/publish.yml`),
  not by tags. `main` is the development branch.
- Release commits follow `<version> - <description of the change>`, and the version in
  `package.json` is bumped in the same commit.
- `README.md` is the user-facing API reference and is expected to be updated in the same change as
  any public API addition.
