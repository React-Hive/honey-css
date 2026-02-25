import type { HoneyCssAstAtRuleNode } from './types';
import type { HoneyTokenCursor } from './create-css-token-cursor';
import { parseCssBlock } from './parse-css-block';

/**
 * Parses an at-rule header string into its name and optional parameters.
 *
 * The header is expected to contain everything following the `@` symbol
 * up to (but not including) one of:
 * - a params token (`(...)`)
 * - a semicolon (`;`)
 * - a block opening brace (`{`)
 *
 * This function performs a minimal, allocation-friendly parse:
 * - Trims leading and trailing whitespace
 * - Extracts the at-rule name up to the first ASCII whitespace
 * - Treats the remaining text (if any) as raw parameters
 *
 * Examples:
 *
 * ```ts
 * parseAtRuleHeader("media")
 * // → { name: "media", params: undefined }
 *
 * parseAtRuleHeader("keyframes spin")
 * // → { name: "keyframes", params: "spin" }
 *
 * parseAtRuleHeader("layer base, components")
 * // → { name: "layer", params: "base, components" }
 * ```
 *
 * @param header - Raw at-rule header text (without `@`)
 *
 * @returns An object containing the parsed at-rule name and optional params
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

  // Find the first ASCII whitespace
  while (i < length) {
    const ch = normalized[i];
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f') {
      break;
    }
    i++;
  }

  // Header contains only the at-rule name
  if (i === length) {
    return {
      name: normalized,
      params: undefined,
    };
  }

  const name = normalized.slice(0, i);

  // Skip consecutive whitespace before params
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
 * Handles both block-style and directive-style at-rules:
 *
 * - Block form:
 *   ```css
 *   @media (max-width: 768px) { ... }
 *   @keyframes spin { ... }
 *   ```
 *
 * - Directive form:
 *   ```css
 *   @import url("file.css");
 *   @layer utilities;
 *   ```
 *
 * Parsing behavior:
 * - Consumes the `at` token
 * - Reads the at-rule header (name + optional params)
 * - Merges explicit `params` tokens when present (e.g. `@media (...)`)
 * - Parses a block body if `{` is encountered
 * - Treats `;`-terminated rules as directives (`body: null`)
 *
 * The returned AST node follows these conventions:
 * - `body === null` → directive at-rule
 * - `body === []` → empty block at-rule
 *
 * @param cursor - Token cursor positioned at an `at` token
 *
 * @returns A parsed {@link HoneyCssAstAtRuleNode}
 */
export const parseCssAtRule = (cursor: HoneyTokenCursor): HoneyCssAstAtRuleNode => {
  cursor.expect('at');

  // Read header text up to params token, semicolon, or block start
  const headerSource = cursor.readUntil(['params', 'semicolon', 'braceOpen']);

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
