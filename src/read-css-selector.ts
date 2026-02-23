import type { HoneyTokenCursor } from './create-css-token-cursor';

/**
 * Reads a CSS selector from the current token cursor position.
 *
 * The selector is reconstructed by sequentially consuming supported tokens
 * until one of the following conditions is met:
 *
 * - A `braceOpen` token (`{`) is encountered
 * - A `braceClose` token (`}`) is encountered (safety stop)
 * - An unsupported token type appears
 * - The end of the token stream is reached
 *
 * Supported token types:
 *
 * - `text` - raw selector fragments such as:
 *   `.btn`, `#id`, `> .child`, `+ .item`, `&[data-open]`, `[data-id="x"]`
 *
 * - `colon` - pseudo selectors and pseudo-elements:
 *   `:hover`, `::before`
 *
 * - `params` - parenthesized groups used in pseudo functions or nth-expressions:
 *   `(2n+1)`, `(:disabled)`
 *
 * - `string` - quoted string values (typically inside attribute selectors)
 *
 * Behavior:
 *
 * - Preserves pseudo selectors and pseudo-elements
 * - Preserves combinators (`>`, `+`, `~`)
 * - Preserves attribute selectors
 * - Preserves pseudo functions such as `:not(...)`
 * - Does **not** consume the `{` token
 *
 * This function performs no validation of selector correctness.
 * It only reconstructs the textual representation from the token stream.
 *
 * @param cursor - Token cursor positioned at the beginning of a selector.
 *
 * @returns The reconstructed selector string (trimmed).
 */
export const readCssSelector = (cursor: HoneyTokenCursor): string => {
  const parts: string[] = [];

  const finish = () => parts.join('').trim();

  while (!cursor.isEof()) {
    const token = cursor.peek();
    if (!token) {
      break;
    }

    switch (token.type) {
      case 'braceOpen':
      case 'braceClose':
        return finish();

      case 'colon':
        parts.push(':');
        break;

      case 'text':
      case 'params':
        parts.push(token.value);
        break;

      case 'string':
        parts.push(`"${token.value}"`);
        break;

      default:
        return finish();
    }

    cursor.next();
  }

  return finish();
};
