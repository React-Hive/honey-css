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

**readCssSelector**

When building custom rule parsing logic, you often need to read a selector safely until `{`.

The `readCssSelector` reconstructs the selector from tokens while preserving:

- pseudo selectors (`:hover`)
- pseudo elements (`::before`)
- attribute selectors (`[data-id="x"]`)
- combinators (`>`, `+`, `~`)
- pseudo functions (`:not(...)`, `:nth-child(...`))

It stops before consuming the `{` token.

#### Example: Reading a Selector

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

This is especially useful when writing your own rule parser or extending parseCss.

#### Example: Speculative Parsing

```ts
const mark = cursor.mark();
const maybeSelector = readCssSelector(cursor);

if (cursor.peek()?.type === "braceOpen") {
  // It's a rule
  cursor.expect("braceOpen");
} else {
  // Not a rule — rewind
  cursor.reset(mark);
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

## 🎯 Use Cases

The **honey-css** is a great fit for:

- CSS-in-JS compilers
- Custom at-rule processors
- Design system engines
- Lightweight CSS preprocessors
- AST-based transformations

It is not intended to fully replace PostCSS or implement the full CSS specification – it’s a focused foundation.

## 📄 License

MIT © Mike Aliinyk

Part of the **[React Hive](https://github.com/React-Hive)** ecosystem 🐝
