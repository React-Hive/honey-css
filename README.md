# @react-hive/honey-css

A lightweight CSS tokenizer + parser that produces a minimal AST for custom CSS processing.

This package is designed as a small foundation for building **CSS transformers**, **preprocessors**, and **CSS-in-JS tooling** – without pulling in heavyweight dependencies like PostCSS.

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

If you're building your own styling layer or transformer pipeline, this gives you the core building blocks – without unnecessary overhead.

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

```json
[
  { type: "text", value: ".btn" },
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

```json
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
