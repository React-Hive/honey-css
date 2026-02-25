import type { HoneyCssAstNode } from './types';
import type { HoneyTokenCursor } from './create-css-token-cursor';
import { parseCssAtRule } from './parse-css-at-rule';
import { readCssKeyOrSelector } from './read-css-key-or-selector';
import { parseCssDeclaration } from './parse-css-declaration';
import { parseCssRule } from './parse-css-rule';

interface ParseCssNodesOptions {
  /**
   * Whether parsing should stop when a closing brace (`}`) is encountered.
   *
   * - `true`: Used when parsing a block body (`{ ... }`)
   *           The closing brace is consumed and parsing stops.
   *
   * - `false`: Used at the root stylesheet level.
   *            Closing braces are not treated specially.
   */
  stopAtBraceClose: boolean;
}

/**
 * Parses a sequence of CSS nodes from the current cursor position.
 *
 * This is the core grammar loop used by both:
 *
 * - `parseCss` (root-level parsing)
 * - `parseCssBlock` (block-level parsing)
 *
 * It resolves the main CSS grammar ambiguity:
 *
 * ```
 * selector { ... }   → rule
 * property: value;   → declaration
 * @rule ...          → at-rule
 * ```
 *
 * Parsing behavior:
 *
 * - Stops at EOF.
 * - Optionally stops at `}` when `stopAtBraceClose` is enabled.
 * - Skips stray semicolons safely.
 * - Delegates:
 *   - `@` → {@link parseCssAtRule}
 *   - `prop: value` → {@link parseCssDeclaration}
 *   - `selector {}` → {@link parseCssRule}
 * - Uses {@link readCssKeyOrSelector} to speculatively determine
 *   whether the upcoming construct is a declaration or a rule.
 *
 * Recovery behavior:
 *
 * - Unknown or malformed tokens are skipped.
 * - The parser never throws for unexpected tokens inside a block.
 * - Ensures forward progress to avoid infinite loops.
 *
 * This function is intentionally low-level and does not perform:
 *
 * - AST normalization
 * - Empty node filtering
 * - Selector resolution
 *
 * @param cursor - Token cursor positioned at the start of a node sequence
 * @param options - Parsing behavior configuration
 *
 * @returns Array of parsed AST nodes
 */
export const parseCssNodes = (
  cursor: HoneyTokenCursor,
  { stopAtBraceClose }: ParseCssNodesOptions,
): HoneyCssAstNode[] => {
  const nodes: HoneyCssAstNode[] = [];

  while (!cursor.isEof()) {
    const token = cursor.peek();
    if (!token) {
      break;
    }

    if (stopAtBraceClose && token.type === 'braceClose') {
      // consume `}`
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

    const keyOrSelector = readCssKeyOrSelector(cursor);
    if (!keyOrSelector) {
      cursor.next();
      continue;
    }

    if (cursor.peek()?.type === 'colon') {
      nodes.push(parseCssDeclaration(cursor, keyOrSelector));
      continue;
    }

    if (cursor.peek()?.type === 'braceOpen') {
      nodes.push(parseCssRule(cursor, keyOrSelector));
      continue;
    }

    cursor.next();
  }

  return nodes;
};
