import type { HoneyCssAstDeclarationNode } from './types';
import type { HoneyTokenCursor } from './create-css-token-cursor';

/**
 * Parses a single CSS declaration node.
 *
 * The cursor must be positioned immediately before the `colon` (`:`)
 * that separates the property name and value.
 *
 * Example:
 *
 * ```css
 * color: red;
 * ```
 *
 * Parsing behavior:
 *
 * 1. Consumes the `colon` token.
 * 2. Reads the declaration value until one of:
 *    - `semicolon` (`;`)
 *    - `braceClose` (`}`) — allows the last declaration in a block
 *      to omit the trailing semicolon.
 * 3. If a `semicolon` is present, it is consumed.
 *
 * Supported forms:
 *
 * ```css
 * color: red;
 * color: red
 * padding: var(--x, 8px);
 * background: url(var(--img));
 * ```
 *
 * Notes:
 *
 * - The returned `value` string is reconstructed using the cursor's
 *   {@link HoneyTokenCursor.readUntil} method.
 * - Spaces are inserted only between consecutive `text` tokens.
 * - `params` and `string` tokens are preserved without adding extra spaces.
 * - The closing `}` token (if encountered) is NOT consumed.
 *
 * @param cursor - Token cursor positioned at the declaration delimiter (`:`).
 * @param prop - Previously parsed property name.
 *
 * @returns A {@link HoneyCssAstDeclarationNode}.
 */
export const parseCssDeclaration = (
  cursor: HoneyTokenCursor,
  prop: string,
): HoneyCssAstDeclarationNode => {
  cursor.expect('colon');

  const value = cursor.readUntil(['semicolon', 'braceClose']);

  if (cursor.peek()?.type === 'semicolon') {
    cursor.next();
  }

  return {
    type: 'declaration',
    prop,
    value,
  };
};
