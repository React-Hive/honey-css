import type { HoneyTokenCursor } from './create-css-token-cursor';
import { readCssSelector } from './read-css-selector';

/**
 * Reads either a **CSS rule selector** or a **declaration property key**
 * from the current cursor position.
 *
 * This helper is used in ambiguous grammar positions where the next token
 * could represent either:
 *
 * - A nested rule:
 *   ```css
 *   selector { ... }
 *   ```
 *
 * - A declaration:
 *   ```css
 *   property: value;
 *   ```
 *
 * ---------------------------------------------------------------------------
 * 🧠 Resolution Strategy
 * ---------------------------------------------------------------------------
 *
 * 1. If the first token is a `colon`, it must be a selector starting with `:`
 *    (e.g. `:root`, `:hover`, `::before`). In this case, it delegates directly
 *    to {@link readCssSelector}.
 *
 * 2. Otherwise, it **speculatively parses** a selector using
 *    {@link readCssSelector}.
 *
 * 3. The parsed selector is accepted **only if** it is immediately followed
 *    by a `braceOpen` (`{`) token.
 *
 * 4. If no `{` follows, the cursor is rewound and the input is treated as
 *    a declaration key instead.
 *
 * ---------------------------------------------------------------------------
 * ⚠️ Notes & Limitations
 * ---------------------------------------------------------------------------
 *
 * - Selector-like property names such as:
 *
 *   ```css
 *   a:hover: 1;
 *   ```
 *
 *   are intentionally treated as declaration keys ending at the first `:`.
 *   In this example, the key will be parsed as `"a"`.
 *
 * - Declaration keys are read using
 *   {@link HoneyTokenCursor.readUntil}, which:
 *   - Inserts spaces only between consecutive `text` tokens
 *   - Keeps `params` and `string` tokens adjacent without adding spaces
 *
 * ---------------------------------------------------------------------------
 * 🔁 Cursor Behavior
 * ---------------------------------------------------------------------------
 *
 * - When a selector is returned:
 *   - The `{` token is **not consumed**
 *   - The cursor will still point to `braceOpen`
 *
 * - When a declaration key is returned:
 *   - The delimiter token (`colon`, `braceOpen`, `semicolon`,
 *     `braceClose`, or `at`) is **not consumed**
 *
 * ---------------------------------------------------------------------------
 *
 * @param cursor - Token cursor positioned at the start of either a selector
 *                 or a declaration key.
 *
 * @returns The parsed selector or declaration key.
 *          Returns an empty string if at EOF or if the first token is unsupported.
 */
export const readCssKeyOrSelector = (cursor: HoneyTokenCursor): string => {
  const first = cursor.peek();
  if (!first) {
    return '';
  }

  // Selector starting with ":" (:root, :hover, ::before, etc.)
  if (first.type === 'colon') {
    return readCssSelector(cursor);
  }

  // Speculative selector parse
  const mark = cursor.mark();
  const candidate = readCssSelector(cursor);

  // A rule block must follow a real selector
  if (cursor.peek()?.type === 'braceOpen') {
    return candidate;
  }

  // Otherwise treat it as a declaration key
  cursor.reset(mark);

  return cursor.readUntil(['colon', 'braceOpen', 'semicolon', 'braceClose', 'at']);
};
