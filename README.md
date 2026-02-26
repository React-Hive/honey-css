# @react-hive/honey-css

A lightweight CSS tokenizer and structural parser that generates a minimal, predictable AST for custom CSS processing.

The **honey-css** is designed as a focused foundation for building:

- CSS transformers
- Lightweight preprocessors
- CSS-in-JS compilers
- Custom styling engines

All without pulling in heavyweight ecosystems like PostCSS.

It gives you structure — not policy.



## ✨ Why honey-css?

Modern CSS tooling is incredibly powerful — but often excessively complex.

Many parsers aim to support the entire CSS specification, plugin systems, validation layers, and edge-case semantics. That’s valuable — but sometimes unnecessary.

Often, what you actually need is:

- A small tokenizer
- A predictable AST
- Nested rule support
- Clean grammar boundaries
- Composable parsing primitives

The **honey-css** focuses on the practical sweet spot:

- 🍯 Minimal surface area
- 🎯 Deterministic, structural output
- 🌳 Small and easy-to-traverse AST
- 🧩 Designed for composition and transformation
- ⚡ Fast and dependency-light

It intentionally performs **structural parsing only** — not full CSS validation.  
That makes it ideal for transformation pipelines where predictability and simplicity matter more than spec completeness.

If you're building your own styling layer, compiler, or design-system engine, honey-css gives you the core building blocks — without unnecessary overhead or abstraction.

## ✨ Features

- ✅ Tokenizes raw CSS into a structured, readable token stream
- ✅ Parses tokens into a minimal, predictable AST
- ✅ Fully supports nested rules and nested at-rules
- ✅ Correctly handles real-world CSS constructs:
  - Declarations (`color: red;`)
  - Complex selectors (`.btn:hover`, `:is(...)`, attribute selectors)
  - At-rules (`@media`, `@layer`, `@keyframes`, `@import`, etc.)
  - Parameter groups (`url(...)`, `var(...)`, nested functions)
  - Quoted strings (`content: "hello"`)
  - Block comments (`/* ... */`)
- ✅ Distinguishes directive at-rules (`body: null`) from block at-rules
- ✅ Resilient parsing with safe recovery (skips unknown or malformed tokens)
- ✅ Deterministic output — no hidden transformations during parsing
- ✅ Small surface area with composable low-level parsing utilities
- ✅ Designed for transformation pipelines and CSS-in-JS compilers
- ✅ Tiny, fast, dependency-light, and easy to extend

## 📦 Installation

Install with pnpm (recommended):

```bash
pnpm add @react-hive/honey-css
```

## 🚀 Quick Start

Tokenizing CSS

```ts
import { tokenizeCss } from "@react-hive/honey-css";

const tokens = tokenizeCss(`
  .btn {
    color: red;
    padding: 12px;
  }
`);

console.log(tokens);
```

*Output:*

```
[
  { "type": "text", value: ".btn" },
  { type: "braceOpen" },

  { type: "text", value: "color" },
  { type: "colon" },
  { type: "text", value: "red" },
  { type: "semicolon" },

  { type: "text", value: "padding" },
  { type: "colon" },
  { type: "text", value: "12px" },
  { type: "semicolon" },

  { type: "braceClose" }
]
```

## 🧠 parseCss

Parses a full CSS string into a minimal Honey AST.

This is the high-level entry point that wires together:

- `tokenizeCss`
- `createCssTokenCursor`
- `parseCssNodes`

It performs structural parsing only — it does not validate CSS identifiers or enforce full CSS specification rules.
The goal is predictable AST generation suitable for transformations and CSS-in-JS engines.

### What It Supports

At the root level, `parseCss` recognizes:

- Declarations → `color: red;`
- Rules → `.btn { ... }`
- At-rules → `@media (...) { ... }`
- Directive at-rules → `@import url("x.css");`
- Nested structures inside rules and at-rules

Stray semicolons and unknown tokens are skipped safely.

### Recovery Behavior

The `parseCss` is designed to be resilient:

- Unknown tokens are skipped
- Malformed constructs do not throw
- Parsing continues whenever possible
- Infinite loops are prevented via forward progress

This makes it ideal for transformation pipelines where partial input may occur.

### Example

```ts
import { parseCss } from "@react-hive/honey-css";

const ast = parseCss(`
  color: red;

  .btn {
    padding: 8px;

    @media (max-width: 600px) {
      display: none;
    }
  }
`);

console.log(ast);
```

*Output:*

```
{
  "type": "stylesheet",
  "body": [
    { "type": "declaration", "prop": "color", "value": "red" },
    {
      "type": "rule",
      "selector": ".btn",
      "body": [
        { "type": "declaration", "prop": "padding", "value": "8px" },
        {
          "type": "atRule",
          "name": "media",
          "params": "(max-width: 600px)",
          "body": [
            { "type": "declaration", "prop": "display", "value": "none" }
          ]
        }
      ]
    }
  ]
}
```

### How It Works Internally

The `parseCss` delegates all grammar handling to:

```ts
parseCssNodes(cursor, { stopAtBraceClose: false })
```

This means:

- Root-level and block-level parsing share the same engine
- Grammar logic lives in one place
- The parser stays small and composable

### When to Use It

Use `parseCss` when:

- You want a complete AST for transformation
- You are building a CSS-in-JS engine
- You are implementing custom at-rule processors
- You need a structured CSS without heavy dependencies

If you need finer control, you can directly use:

- `parseCssNodes`
- `parseCssBlock`
- `parseCssRule`
- `parseCssAtRule`

## 🧭 Token Cursor Utilities

For writing your own parser logic, transformers, or custom readers, honey-css provides a small helper:

### createCssTokenCursor

The cursor is a lightweight abstraction over the token stream that enables:

- lookahead (`peek`)
- sequential reading (`next`)
- safe assertions (`expect`)
- speculative parsing (`mark` + `reset`)
- reading chunks (`readUntil`)
- skipping tokens for recovery (`skipUntil`)

**Cursor API**

The `createCssTokenCursor(tokens)` returns an object with:

- `peek()` - Look at the current token without consuming it
- `next()` - Consume the current token and advance
- `isEof()` - Returns true when the token stream is finished
- `expect(type)` - Assert the next token type (throws if mismatch)
- `mark()/reset(mark)` - Create checkpoints for speculative parsing
- `readUntil([...])` - Read combined `text`/`string`/`params` until a stop token
- `skipUntil([...])` - Skip tokens until a stop token is found

**Example: Reading a Declaration Manually**

```ts
import { tokenizeCss, createCssTokenCursor } from "@react-hive/honey-css";

const tokens = tokenizeCss('color: red;');
const cursor = createCssTokenCursor(tokens);

// Read property name
const prop = cursor.readUntil(['colon']);
cursor.expect('colon');

// Read value
const value = cursor.readUntil(['semicolon']);
cursor.expect('semicolon');

console.log(prop);  // "color"
console.log(value); // "red"
```

**Example: Skipping Until a Block Ends**

```ts
cursor.skipUntil(["braceClose"]);
cursor.expect("braceClose");
```

This is extremely useful for:

- parser error recovery
- ignoring unsupported syntax
- skipping unknown nested blocks

### 🔎 readCssSelector

When building custom rule parsing logic, you often need to read a selector safely until `{`.

The `readCssSelector` reconstructs the selector from tokens while preserving:

- pseudo selectors (`:hover`)
- pseudo elements (`::before`)
- attribute selectors (`[data-id="x"]`)
- combinators (`>`, `+`, `~`)
- pseudo functions (`:not(...)`, `:nth-child(...`))

It stops before consuming the `{` token.

**Example**

```ts
import {
  tokenizeCss,
  createCssTokenCursor,
  readCssSelector,
} from "@react-hive/honey-css";

const tokens = tokenizeCss(`
  button:not(:disabled):hover {
    opacity: 0.5;
  }
`);

const cursor = createCssTokenCursor(tokens);

const selector = readCssSelector(cursor);
cursor.expect("braceOpen");

console.log(selector);
// "button:not(:disabled):hover"
```

### 🔁 readCssKeyOrSelector

Inside a block, grammar becomes ambiguous:

```
selector { ... }
property: value;
```

To resolve this, use `readCssKeyOrSelector`.

It:

- Speculatively parses a selector
- Accepts it only if { follows
- Otherwise, rewinds and reads a declaration key

**Example**

```ts
import {
  tokenizeCss,
  createCssTokenCursor,
  readCssKeyOrSelector,
} from "@react-hive/honey-css";

const tokens = tokenizeCss(`
  .btn { color: red; }
`);

const cursor = createCssTokenCursor(tokens);

const keyOrSelector = readCssKeyOrSelector(cursor);

console.log(keyOrSelector); // ".btn"
```

### 🧱 parseCssDeclaration

When building a custom parser on top of the token cursor, you often need to parse a single declaration inside a rule block.

The `parseCssDeclaration` handles this safely and consistently.

It:
- Expects the cursor to be positioned at the `:` token
- Reads the value until `;` or `}`
- Supports missing trailing semicolons
- Preserves strings and nested params like `var(...)` or `url(...)`

**Example**

```ts
import {
  tokenizeCss,
  createCssTokenCursor,
  parseCssDeclaration,
} from "@react-hive/honey-css";

const tokens = tokenizeCss(`
  color: var(--primary, red);
`);

const cursor = createCssTokenCursor(tokens);

// Read property name
const prop = cursor.readUntil(["colon"]);

// Parse declaration
const declaration = parseCssDeclaration(cursor, prop);

console.log(declaration);
```

*Output:*

```
{
  type: "declaration",
  prop: "color",
  value: "var(--primary, red)"
}
```

### 🧩 resolveCssSelector

When implementing nested rules (like in CSS-in-JS engines), child selectors must be resolved against their parent selector.

The `resolveCssSelector` helper performs this safely and predictably.

It:

- Performs full Cartesian expansion of comma-separated selector lists
- Replaces explicit parent references (`&`)
- Creates descendant relationships when `&` is not present
- Preserves complex selectors, including:
  - Pseudo-classes (`:hover`)
  - Pseudo-elements (`::before`)
  - Attribute selectors (`[data-x="a,b"]`)
  - Nested selector functions (`:is(...)`, `:not(...)`)
  - Combinators (`>`, `+`, `~`)

**Basic Example**

```ts
import { resolveCssSelector } from "@react-hive/honey-css";

resolveCssSelector(".child", ".scope");
// → ".scope .child"

resolveCssSelector("&:hover", ".btn");
// → ".btn:hover"
```

**Comma Expansion**

Both parent and child selectors may contain comma-separated lists.

```ts
resolveCssSelector(".a, .b", ".scope");
// → ".scope .a, .scope .b"

resolveCssSelector(".x, .y", ".a, .b");
// → ".a .x, .a .y, .b .x, .b .y"
```

**Parent Reference (&)**

If the child selector contains `&`, it is replaced with the parent selector.

```ts
resolveCssSelector("& + &", ".item");
// → ".item + .item"

resolveCssSelector("&:hover, .icon", ".btn, .card");
// → ".btn:hover, .btn .icon, .card:hover, .card .icon"
```

**Complex Selectors**

The resolver safely handles nested commas inside functions and attribute selectors.

```ts
resolveCssSelector(':is(.a, .b)', '.scope');
// → ".scope :is(.a, .b)"

resolveCssSelector('[data-x="a,b"]', '.scope');
// → ".scope [data-x=\"a,b\"]"
```

### 🧾 stringifyCss

After transforming or generating a CSS AST, you can convert it back into a compact CSS string using `stringifyCss`.

This is the final stage of the honey-css pipeline.

What It Does:

- Converts the AST back into valid compact CSS
- Removes empty declarations (`value.trim() === ""`)
- Removes empty rules (rule body becomes empty after stringification)
- Removes empty block at-rules (at-rules with `body: []` that stringify to nothing)
- Preserves directive at-rules (`body: null`) and prints them with `;`

**Example**

```ts
import { stringifyCss } from "@react-hive/honey-css";

const ast = {
  type: "stylesheet",
  body: [
    {
      type: "rule",
      selector: ".btn",
      body: [
        { type: "declaration", prop: "padding", value: "8px" },
        { type: "declaration", prop: "color", value: "red" },
      ],
    },
  ],
};

const css = stringifyCss(ast);

console.log(css);
// ".btn{padding:8px;color:red;}"
```

**Directive VS block at-rules**

The `stringifyCss` treats at-rules with `body === null` as directive-style rules and serializes them with a trailing semicolon.

```ts
import { stringifyCss } from "@react-hive/honey-css";

const ast = {
  type: "stylesheet",
  body: [
    {
      type: "atRule",
      name: "charset",
      params: '"UTF-8"',
      body: null,
    },
  ],
};

console.log(stringifyCss(ast));
// '@charset "UTF-8";'
```

Block at-rules (`body !== null`) are serialized using curly braces: `@name params{...}`.

```ts
import { stringifyCss } from "@react-hive/honey-css";

const ast = {
  type: "stylesheet",
  body: [
    {
      type: "atRule",
      name: "media",
      params: "(min-width: 100px)",
      body: [],
    },
  ],
};

console.log(stringifyCss(ast));
// ""
```

## 🧱 Low-Level Block & Rule Parsers

When building your own parser pipeline on top of `createCssTokenCursor`, you can use the lower-level block and rule utilities directly.

### 🧩 parseCssAtRule

Parses an at-rule from the token stream.

Supports both block-style and directive-style at-rules:

```
@media (max-width: 768px) { ... }
@keyframes spin { ... }
@import url("file.css");
```

What is does:

- Merges space-delimited and params tokens correctly
- Returns `body: null` for directive at-rules
- Returns `body: []` for empty block at-rules

**Example**

```ts
import {
  tokenizeCss,
  createCssTokenCursor,
  parseCssAtRule,
} from "@react-hive/honey-css";

const tokens = tokenizeCss(`
  @media (max-width: 768px) {
    color: red;
  }
`);

const cursor = createCssTokenCursor(tokens);

const atRule = parseCssAtRule(cursor);

console.log(atRule);
```

*Output:*

```
{
  type: "atRule",
  name: "media",
  params: "(max-width: 768px)",
  body: [
    {
      type: "declaration",
      prop: "color",
      value: "red"
    }
  ]
}
```

## 🧱 parseCssBlock

Parses the contents of a `{ ... }` block.

Resolves grammar ambiguity inside blocks:

```
selector { ... }
property: value;
@rule ...
```

It:

- Stops at the matching `}`
- Skips stray semicolons (`;`) safely
- Delegates:
  - declarations → `parseCssDeclaration`
  - nested rules → `parseCssRule`
  - nested at-rules → `parseCssAtRule`

**Example**

```ts
import {
  tokenizeCss,
  createCssTokenCursor,
} from "@react-hive/honey-css";

import { parseCssBlock } from "@react-hive/honey-css";

const tokens = tokenizeCss(`
  {
    color: red;
    .child { padding: 8px; }
  }
`);

const cursor = createCssTokenCursor(tokens);
cursor.expect("braceOpen");

const nodes = parseCssBlock(cursor);

console.log(nodes);
```

*Output:*

```
[
  { type: "declaration", prop: "color", value: "red" },
  {
    type: "rule",
    selector: ".child",
    body: [
      { type: "declaration", prop: "padding", value: "8px" }
    ]
  }
]
```

## 🧾 parseCssRule

Parses a CSS rule body for a given selector.

- Expects the cursor to be positioned at `{`
- Delegates body parsing to `parseCssBlock`
- Preserves the selector exactly as provided

**Example**

```ts
import {
  tokenizeCss,
  createCssTokenCursor,
} from "@react-hive/honey-css";

import { parseCssRule } from "@react-hive/honey-css";

const tokens = tokenizeCss(`
  {
    color: red;
  }
`);

const cursor = createCssTokenCursor(tokens);

const rule = parseCssRule(cursor, ".btn");

console.log(rule);
```

*Output:*

```
{
  type: "rule",
  selector: ".btn",
  body: [
    { type: "declaration", prop: "color", value: "red" }
  ]
}
```

## 🌳 AST Overview

The AST is intentionally minimal and easy to traverse.

**Stylesheet Root**

```
{
  type: "stylesheet",
  body: HoneyCssNode[]
}
```

**Declaration Node**

```
{
  type: "declaration",
  prop: "padding",
  value: "12px"
}
```

Represents:
```
padding: 12px;
```

**Rule Node**

```
{
  type: "rule",
  selector: ".child:hover",
  body: [...]
}
```

Represents:

```
.child:hover {
  opacity: 0.5;
}
```

**At-Rule Node**

```
{
  type: "atRule",
  name: "media",
  params: "(max-width: 768px)",
  body: [...]
}
```

Represents:

```
@media (max-width: 768px) {
  color: red;
}
```

## 🎯 Use Cases

The `honey-css` intentionally exposes low-level parsing primitives so you can build exactly the tooling you need — without inheriting a large opinionated ecosystem.

It is a foundation, not a framework.

You can use it to:

- 🛠 Build your own CSS compiler or transformer pipeline
- 🧩 Implement custom at-rules (e.g. `@honey-media`, `@theme`, etc.)
- 🔁 Flatten nested rules for CSS-in-JS engines
- 🎨 Create design-system or token processors
- 🔍 Perform AST transformations before stringification
- 🧠 Build domain-specific styling languages on top of CSS
- 📦 Implement scoped or isolated CSS engines
- ⚡ Generate minimal production-ready CSS from structured input

Because the parser is structural (not validating), it is predictable and easy to control.  
There are no hidden behaviors — transformations are explicit and composable.

### What honey-css Is Not

- ❌ Not a full CSS spec implementation
- ❌ Not a PostCSS replacement
- ❌ Not a validation engine
- ❌ Not a plugin-heavy ecosystem

Instead, it is a focused, lightweight foundation for people who want to build their own styling engines — cleanly, deterministically, and without unnecessary abstraction.

## 📄 License

MIT © Mike Aliinyk

Part of the **[React Hive](https://github.com/React-Hive)** ecosystem 🐝
