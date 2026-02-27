import type { HoneyCssAstAtRuleNode } from './types';
import type { HoneyTokenCursor } from './create-css-token-cursor';
import { parseCssBlock } from './parse-css-block';

/**
 * Parses an at-rule header string into its name and optional parameters.
 *
 * The header is expected to contain everything following the `@` symbol up to (but not including):
 * - a semicolon (`;`)
 * - a block opening brace (`{`)
 *
 * Unlike a naive whitespace-based parser, this implementation:
 *
 * - Trims leading and trailing whitespace
 * - Extracts the at-rule name up to:
 *   - the first ASCII whitespace character, OR
 *   - the first opening parenthesis `(` (start of functional params)
 * - Treats the remaining substring (if any) as raw parameters
 *
 * This allows support for:
 *
 * - Functional headers without whitespace:
 *   `@media(max-width: 600px)`
 *
 * - Space-delimited headers:
 *   `@layer utilities`
 *
 * - Complex modern CSS at-rules:
 *   `@scope (.card) to (.title)`
 *
 * The returned `params` string preserves the original formatting
 * reconstructed from tokens (including parentheses groups).
 *
 * Examples:
 *
 * ```ts
 * parseAtRuleHeader("media")
 * // → { name: "media", params: undefined }
 *
 * parseAtRuleHeader("media(max-width: 600px)")
 * // → { name: "media", params: "(max-width: 600px)" }
 *
 * parseAtRuleHeader("layer base, components")
 * // → { name: "layer", params: "base, components" }
 *
 * parseAtRuleHeader("scope(.card)to(.title)")
 * // → { name: "scope", params: "(.card)to(.title)" }
 * ```
 *
 * @param header - Raw at-rule header text (without `@`)
 *
 * @returns Parsed at-rule name and optional params
 */
const parseAtRuleHeader = (header: string) => {
  const normalized = header.trim();
  if (!normalized) {
    return {
      name: '',
      params: undefined,
    };
  }

  let i = 0;
  const length = normalized.length;

  // Stop at whitespace OR "(" (start of params)
  while (i < length) {
    const ch = normalized[i];

    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f' || ch === '(') {
      break;
    }

    i++;
  }

  const name = normalized.slice(0, i);

  // Skip whitespace only (NOT "(")
  while (i < length) {
    const ch = normalized[i];
    if (ch !== ' ' && ch !== '\t' && ch !== '\n' && ch !== '\r' && ch !== '\f') {
      break;
    }

    i++;
  }

  const params = normalized.slice(i);

  return {
    name,
    params: params || undefined,
  };
};

/**
 * Parses a CSS at-rule from the token stream.
 *
 * Supported forms include:
 *
 * 1. Directive at-rules (no block):
 *
 * ```css
 * @charset;
 * @import url("file.css");
 * @layer utilities;
 * ```
 *
 * 2. Block at-rules:
 *
 * ```css
 * @media (max-width: 768px) { ... }
 * @keyframes spin { ... }
 * @scope (.card) { ... }
 * ```
 *
 * 3. Modern CSS functional headers:
 *
 * - Functional without whitespace:
 *   `@media(max-width: 600px)`
 *
 * - Multi-part params:
 *   `@scope (.card) to (.title)`
 *
 * Parsing behavior:
 *
 * - Consumes the `at` token
 * - Reads the full header up to `{` or `;`
 * - Extracts the at-rule name and parameters
 * - Merges any trailing `params` tokens (e.g. parentheses groups)
 * - Parses a block body if `{` is encountered
 * - Treats `;`-terminated rules as directives (`body: null`)
 *
 * The returned AST node follows these conventions:
 *
 * - `body === null` → directive at-rule
 * - `body === []` → empty block at-rule
 * - `params === undefined` → no header params
 *
 * This parser is tolerant and does not enforce semantic validation
 * of specific at-rule grammars. It preserves structure for:
 *
 * - Nested rules
 * - Nested at-rules
 * - Custom at-rules (e.g. `@honey-media`)
 * - Emerging CSS features (e.g. `@scope`)
 *
 * @param cursor - Token cursor positioned at an `at` token
 *
 * @returns Parsed {@link HoneyCssAstAtRuleNode}
 */
export const parseCssAtRule = (cursor: HoneyTokenCursor): HoneyCssAstAtRuleNode => {
  cursor.expect('at');

  // Read header text up to semicolon or block start
  const headerSource = cursor.readUntil(['semicolon', 'braceOpen']);

  const { name, params: initialParams } = parseAtRuleHeader(headerSource);
  let params = initialParams;

  // Merge explicit params token if present (e.g. @media (...))
  if (cursor.peek()?.type === 'params') {
    const paramToken = cursor.expect('params').value;

    params = params ? `${params}${paramToken}` : paramToken;
  }

  // Block-style at-rule
  if (cursor.peek()?.type === 'braceOpen') {
    return {
      type: 'atRule',
      name,
      params,
      body: parseCssBlock(cursor),
    };
  }

  // Directive-style at-rule
  if (cursor.peek()?.type === 'semicolon') {
    cursor.next();
  }

  return {
    type: 'atRule',
    name,
    params,
    body: null,
  };
};
