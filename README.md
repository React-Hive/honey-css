# @react-hive/honey-css

A lightweight CSS tokenizer + parser that produces a minimal AST for custom CSS processing.

This package is designed as a small foundation for building **CSS transformers**, **preprocessors**, and **CSS-in-JS tooling** — without pulling in heavyweight dependencies like PostCSS.

---

## ✨ Why honey-css?

Most CSS parsers today are extremely powerful… and extremely complex.

They solve *everything*, but sometimes you only need:

- a small tokenizer
- a predictable AST
- support for nested rules
- a clean base for custom transformations

**honey-css** focuses on the sweet spot:

- 🍯 Small surface area
- 🎯 Predictable output
- 🌳 Minimal AST structure
- 🧩 Easy to extend
- ⚡ Perfect for custom styling engines

If you're building your own styling layer or transformer pipeline, this gives you the core building blocks — without unnecessary overhead.

---

## ✨ Features

- ✅ Tokenizes raw CSS into structured tokens
- ✅ Parses tokens into a minimal developer-friendly AST
- ✅ Supports nested rules and nested at-rules
- ✅ Handles common real-world CSS syntax:
  - declarations (`color: red;`)
  - selectors (`.btn:hover {}`)
  - at-rules (`@media (...) {}`)
  - params groups (`url(...)`, `var(...)`)
  - quoted strings (`content: "hello"`)
  - block comments (`/* ... */`)
- ✅ Tiny, fast, and easy to extend
- ✅ Built for CSS-in-JS engines and custom compilers

---

## 📦 Installation

Install with pnpm (recommended):

```bash
pnpm add @react-hive/honey-css
```

---

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

Output:

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

---

## Parsing CSS into AST

```ts
import { parseCss } from "@react-hive/honey-css";

const ast = parseCss(`
  .btn {
    color: red;
  }
`);

console.log(ast);
```

Output:

```
{
  type: "stylesheet",
  body: [
    {
      type: "rule",
      selector: ".btn",
      body: [
        {
          type: "declaration",
          prop: "color",
          value: "red"
        }
      ]
    }
  ]
}
```

---

## 🧭 Token Cursor Utilities

For writing your own parser logic, transformers, or custom readers, honey-css provides a small helper:

**createCssTokenCursor**

The cursor is a lightweight abstraction over the token stream that enables:

- lookahead (`peek`)
- sequential reading (`next`)
- safe assertions (`expect`)
- speculative parsing (`mark` + `reset`)
- reading chunks (`readUntil`)
- skipping tokens for recovery (`skipUntil`)

### Cursor API

The `createCssTokenCursor(tokens)` returns an object with:

- `peek()` - Look at the current token without consuming it
- `next()` - Consume the current token and advance
- `isEof()` - Returns true when the token stream is finished
- `expect(type)` - Assert the next token type (throws if mismatch)
- `mark()/reset(mark)` - Create checkpoints for speculative parsing
- `readUntil([...])` - Read combined `text`/`string`/`params` until a stop token
- `skipUntil([...])` - Skip tokens until a stop token is found

#### Example: Reading a Declaration Manually

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

#### Example: Skipping Until a Block Ends

```ts
cursor.skipUntil(["braceClose"]);
cursor.expect("braceClose");
```

This is extremely useful for:

- parser error recovery
- ignoring unsupported syntax
- skipping unknown nested blocks

🔎 **readCssSelector**

When building custom rule parsing logic, you often need to read a selector safely until `{`.

The `readCssSelector` reconstructs the selector from tokens while preserving:

- pseudo selectors (`:hover`)
- pseudo elements (`::before`)
- attribute selectors (`[data-id="x"]`)
- combinators (`>`, `+`, `~`)
- pseudo functions (`:not(...)`, `:nth-child(...`))

It stops before consuming the `{` token.

#### Example

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

🔁 **readCssKeyOrSelector**

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

#### Example

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

This helper makes it easy to implement nested rule parsing without writing complex logic.

🧱 **parseCssDeclaration**

When building a custom parser on top of the token cursor, you often need to parse a single declaration inside a rule block.

The `parseCssDeclaration` handles this safely and consistently.

It:
- Expects the cursor to be positioned at the `:` token
- Reads the value until `;` or `}`
- Supports missing trailing semicolons
- Preserves strings and nested params like `var(...)` or `url(...)`

#### Example

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

Output:

```
{
  type: "declaration",
  prop: "color",
  value: "var(--primary, red)"
}
```

🧩 **resolveCssSelector**

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

#### Basic Example

```ts
import { resolveCssSelector } from "@react-hive/honey-css";

resolveCssSelector(".child", ".scope");
// → ".scope .child"

resolveCssSelector("&:hover", ".btn");
// → ".btn:hover"
```

#### Comma Expansion

Both parent and child selectors may contain comma-separated lists.

```ts
resolveCssSelector(".a, .b", ".scope");
// → ".scope .a, .scope .b"

resolveCssSelector(".x, .y", ".a, .b");
// → ".a .x, .a .y, .b .x, .b .y"
```

#### Parent Reference (&)

If the child selector contains `&`, it is replaced with the parent selector.

```ts
resolveCssSelector("& + &", ".item");
// → ".item + .item"

resolveCssSelector("&:hover, .icon", ".btn, .card");
// → ".btn:hover, .btn .icon, .card:hover, .card .icon"
```

#### Complex Selectors

The resolver safely handles nested commas inside functions and attribute selectors.

```ts
resolveCssSelector(':is(.a, .b)', '.scope');
// → ".scope :is(.a, .b)"

resolveCssSelector('[data-x="a,b"]', '.scope');
// → ".scope [data-x=\"a,b\"]"
```

🧾 **stringifyCss**

After transforming or generating a CSS AST, you can convert it back into a compact CSS string using `stringifyCss`.

This is the final stage of the honey-css pipeline.

What It Does:

- Converts the AST back into valid compact CSS
- Removes empty declarations (`value.trim() === ""`)
- Removes empty rules (rule body becomes empty after stringification)
- Removes empty block at-rules (at-rules with `body: []` that stringify to nothing)
- Preserves directive at-rules (`body: null`) and prints them with `;`

#### Example

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

#### Directive VS block at-rules

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

---

## 🧱 Low-Level Block & Rule Parsers

When building your own parser pipeline on top of `createCssTokenCursor`, you can use the lower-level block and rule utilities directly.

These are the same building blocks used internally by `parseCss`.

🧩 **parseCssAtRule**

Parses an at-rule from the token stream.

Supports both block-style and directive-style at-rules:

```
@media (max-width: 768px) { ... }
@keyframes spin { ... }
@import url("file.css");
```

It:

- Merges space-delimited and params tokens correctly
- Returns `body: null` for directive at-rules
- Returns `body: []` for empty block at-rules

#### Example

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

Output:

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

🧱 **parseCssBlock**

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

#### Example

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

Output:

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

🧾 **parseCssRule**

Parses a CSS rule body for a given selector.

- Expects the cursor to be positioned at `{`
- Delegates body parsing to `parseCssBlock`
- Preserves the selector exactly as provided

#### Example

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

Output:

```
{
  type: "rule",
  selector: ".btn",
  body: [
    { type: "declaration", prop: "color", value: "red" }
  ]
}
```

---

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

---

## 🎯 Use Cases

The `honey-css` intentionally exposes low-level parsing primitives so you can:

- Build your own CSS compiler
- Implement custom at-rules
- Extend the grammar
- Perform AST transformations mid-parse
- Create domain-specific styling engines

Instead of a monolithic parser, you get composable building blocks.

It is not intended to fully replace PostCSS or implement the full CSS specification – it’s a focused foundation.

## 📄 License

MIT © Mike Aliinyk

Part of the **[React Hive](https://github.com/React-Hive)** ecosystem 🐝
