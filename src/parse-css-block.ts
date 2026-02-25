import type { HoneyCssAstNode } from './types';
import type { HoneyTokenCursor } from './create-css-token-cursor';
import { parseCssRule } from './parse-css-rule';
import { parseCssAtRule } from './parse-css-at-rule';
import { readCssKeyOrSelector } from './read-css-key-or-selector';
import { parseCssDeclaration } from './parse-css-declaration';

/**
 * Parses a CSS block body into a list of AST nodes.
 *
 * The cursor must be positioned **immediately after** a `{` token.
 * Parsing continues until the matching `}` is encountered.
 *
 * This function resolves the core grammar ambiguity inside blocks:
 *
 * ```
 * selector { ... }   → nested rule
 * property: value;   → declaration
 * @rule ...          → at-rule
 * ```
 *
 * Parsing behavior:
 *
 * - Stops when a `braceClose` (`}`) token is encountered.
 * - Skips stray semicolons safely.
 * - Delegates:
 *   - `@` → {@link parseCssAtRule}
 *   - `prop: value` → {@link parseCssDeclaration}
 *   - `selector {}` → {@link parseCssRule}
 * - Uses {@link readCssKeyOrSelector} to speculatively determine
 *   whether the next construct is a declaration key or a selector.
 * - Advances safely on unrecognized tokens to avoid infinite loops.
 *
 * Recovery behavior:
 *
 * - Unknown or malformed constructs are skipped.
 * - The parser never throws for unexpected tokens inside a block.
 *
 * Examples:
 *
 * ```css
 * {
 *   color: red;
 *   .child { padding: 8px; }
 *   @media (max-width: 600px) { display: none; }
 * }
 * ```
 *
 * @param cursor - Token cursor positioned after `{`
 *
 * @returns Array of parsed AST nodes inside the block
 */
export const parseCssBlock = (cursor: HoneyTokenCursor): HoneyCssAstNode[] => {
  const nodes: HoneyCssAstNode[] = [];

  while (!cursor.isEof()) {
    const token = cursor.peek();
    if (!token) {
      break;
    }

    if (token.type === 'braceClose') {
      cursor.next();
      break;
    }

    if (token.type === 'semicolon') {
      cursor.next();
      continue;
    }

    if (token.type === 'at') {
      nodes.push(parseCssAtRule(cursor));
      continue;
    }

    const selectorOrProp = readCssKeyOrSelector(cursor);
    if (!selectorOrProp) {
      cursor.next();
      continue;
    }

    if (cursor.peek()?.type === 'colon') {
      nodes.push(parseCssDeclaration(cursor, selectorOrProp));
      continue;
    }

    if (cursor.peek()?.type === 'braceOpen') {
      nodes.push(parseCssRule(cursor, selectorOrProp));
      continue;
    }

    cursor.next();
  }

  return nodes;
};
