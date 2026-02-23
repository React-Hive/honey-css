/**
 * A single lexical token produced by the Honey CSS tokenizer.
 *
 * This discriminated union represents the minimal syntax units
 * required by the Honey CSS parser.
 *
 * Token categories:
 *
 * Structural tokens (no value):
 * - `braceOpen`   → `{`
 * - `braceClose`  → `}`
 * - `colon`       → `:`
 * - `semicolon`   → `;`
 * - `at`          → `@`
 *
 * Value tokens (contain `value`):
 * - `text`   → Plain text fragments (selectors, property names, raw values)
 * - `params` → Parenthesized groups including parentheses (e.g. `(min-width: 768px)`)
 * - `string` → Quoted string contents without surrounding quotes
 *
 * This discriminated union ensures:
 * - Tokens that require a value always have one
 * - Punctuation tokens never carry unnecessary data
 * - TypeScript can safely narrow tokens based on `type`
 *
 * Used throughout:
 * - Selector parsing
 * - Declaration parsing
 * - At-rule parsing
 * - AST construction
 */
export type HoneyCssToken =
  | { type: 'braceOpen' }
  | { type: 'braceClose' }
  | { type: 'colon' }
  | { type: 'semicolon' }
  | { type: 'at' }
  | { type: 'text'; value: string }
  | { type: 'params'; value: string }
  | { type: 'string'; value: string };

/**
 * Union of all supported Honey CSS token type names.
 *
 * This is derived automatically from {@link HoneyCssToken}
 * to ensure strong type consistency between token instances
 * and token-type comparisons.
 *
 * Useful for:
 * - Cursor expectations (`expect('braceOpen')`)
 * - Stop conditions in parsing helpers (`readUntil(['braceOpen'])`)
 * - Type narrowing in switch statements
 */
export type HoneyCssTokenType = HoneyCssToken['type'];
