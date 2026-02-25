import type { HoneyCssAstNode } from './types';
import type { HoneyTokenCursor } from './create-css-token-cursor';
import { parseCssNodes } from './parse-css-nodes';

/**
 * Parses the contents of a CSS block (`{ ... }`) into AST nodes.
 *
 * The cursor must be positioned immediately **after** opening `{`.
 * Parsing continues until the matching `}` is encountered.
 *
 * Internally, this delegates to {@link parseCssNodes} with `stopAtBraceClose: true`, meaning:
 * - Parsing stops when a `braceClose` (`}`) token is reached
 * - The closing brace is consumed
 *
 * This function does not:
 * - Perform AST normalization
 * - Filter empty nodes
 * - Resolve nested selectors
 *
 * It strictly parses the structural contents of the block.
 *
 * Example:
 *
 * ```css
 * {
 *   color: red;
 *   .child { padding: 8px; }
 * }
 * ```
 *
 * @param cursor - Token cursor positioned after `{`
 *
 * @returns Parsed AST nodes inside the block
 */
export const parseCssBlock = (cursor: HoneyTokenCursor): HoneyCssAstNode[] =>
  parseCssNodes(cursor, {
    stopAtBraceClose: true,
  });
