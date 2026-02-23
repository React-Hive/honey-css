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

/**
 * Root node of a parsed CSS document.
 *
 * Represents the entire stylesheet produced by the parser.
 *
 * Example:
 *
 * ```css
 * .btn { color: red; }
 * ```
 */
export interface HoneyCssAstStylesheetNode {
  type: 'stylesheet';
  /**
   * Top-level nodes contained in the stylesheet.
   *
   * Typically, includes:
   * - rule nodes
   * - at-rule nodes
   *
   * In recovery scenarios, may include declarations.
   */
  body: HoneyCssAstNode[];
}

/**
 * Represents a standard CSS rule.
 *
 * Example:
 *
 * ```css
 * .btn:hover {
 *   color: red;
 * }
 * ```
 */
export interface HoneyCssAstRuleNode {
  type: 'rule';
  /**
   * Fully reconstructed selector string.
   *
   * Examples:
   * - ".btn:hover"
   * - "&:focus"
   * - "button:not(:disabled)"
   */
  selector: string;
  /**
   * Nodes contained inside the rule block.
   *
   * Typically, declarations, but may also include:
   * - nested rules
   * - nested at-rules
   */
  body: HoneyCssAstNode[];
}

/**
 * Represents a CSS declaration.
 *
 * Example:
 *
 * ```css
 * color: red;
 * padding: var(--spacing-md);
 * ```
 */
export interface HoneyCssAstDeclarationNode {
  type: 'declaration';
  /**
   * Property name.
   *
   * Examples:
   * - "color"
   * - "padding"
   * - "--primary-color"
   */
  prop: string;
  /**
   * Raw value string reconstructed from tokens.
   *
   * Examples:
   * - "red"
   * - "var(--spacing-md)"
   * - "url(var(--img))"
   */
  value: string;
}

/**
 * Represents a CSS at-rule.
 *
 * Examples:
 *
 * ```css
 * @media (max-width: 768px) { ... }
 * @keyframes spin { ... }
 * @charset "UTF-8";
 * ```
 */
export interface HoneyCssAstAtRuleNode {
  type: 'atRule';
  /**
   * At-rule name without the "@" prefix.
   *
   * Examples:
   * - "media"
   * - "keyframes"
   * - "layer"
   * - "charset"
   */
  name: string;
  /**
   * Optional at-rule parameters.
   *
   * Examples:
   * - "(max-width: 768px)"
   * - "spin"
   *
   * Undefined for parameterless directives.
   */
  params?: string;
  /**
   * Nodes contained inside the at-rule block.
   *
   * Empty array for directive-style rules
   * (e.g. `@charset "UTF-8";`).
   */
  body: HoneyCssAstNode[];
}

/**
 * Union type representing any possible CSS AST node.
 *
 * Used when traversing, transforming, or analyzing
 * the parsed stylesheet tree.
 */
export type HoneyCssAstNode =
  | HoneyCssAstStylesheetNode
  | HoneyCssAstRuleNode
  | HoneyCssAstDeclarationNode
  | HoneyCssAstAtRuleNode;
