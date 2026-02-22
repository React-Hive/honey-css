/**
 * All supported token types produced by the Honey CSS tokenizer.
 *
 * These tokens represent the minimal syntax units needed for parsing:
 * - Structural braces (`{` / `}`)
 * - Punctuation (`:` / `;`)
 * - At-rules (`@`)
 * - Parenthesized groups (`(...)`)
 * - Strings (`"..."`, `'...'`)
 * - Plain text chunks (selectors, property names, values)
 */
export type HoneyCssTokenType =
  | 'braceOpen'
  | 'braceClose'
  | 'colon'
  | 'semicolon'
  | 'at'
  | 'params'
  | 'string'
  | 'text';

/**
 * A single token produced by {@link tokenizeCss}.
 *
 * Some token types (like `text`, `params`, `string`) include a `value`,
 * while punctuation tokens do not.
 */
export interface HoneyCssToken {
  type: HoneyCssTokenType;
  value?: string;
}
