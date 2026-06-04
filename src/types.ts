import * as CSS from 'csstype';

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
 * Represents a CSS at-rule node.
 *
 * At-rules can be either:
 *
 * 1. **Block at-rules** — contains a rule block:
 *
 * ```css
 * @media (max-width: 768px) { ... }
 * @keyframes spin { ... }
 * ```
 *
 * 2. **Directive at-rules** — end with a semicolon and do not contain a block:
 *
 * ```css
 * @charset "UTF-8";
 * @import url("file.css");
 * ```
 */
export interface HoneyCssAstAtRuleNode {
  type: 'atRule';
  /**
   * The at-rule name without the "@" prefix.
   *
   * Examples:
   * - `"media"`
   * - `"keyframes"`
   * - `"layer"`
   * - `"charset"`
   */
  name: string;
  /**
   * Optional at-rule parameters.
   *
   * Examples:
   * - `"(max-width: 768px)"`
   *
   * This is undefined when the at-rule does not include parameters.
   */
  params?: string;
  /**
   * The rule block contents.
   *
   * - `HoneyCssAstNode[]` → block-style at-rule (`@media {...}`)
   * - `null` → directive-style at-rule (`@charset "UTF-8";`)
   *
   * An empty array (`[]`) represents an explicitly empty block:
   *
   * ```css
   * @media (min-width: 100px) {}
   * ```
   */
  body: HoneyCssAstNode[] | null;
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

/**
 * Represents absolute CSS dimension units.
 *
 * These units are fixed in physical measurements.
 *
 * - `'px'` — pixels
 * - `'cm'` — centimeters
 * - `'mm'` — millimeters
 * - `'in'` — inches
 * - `'pt'` — points
 * - `'pc'` — picas
 */
type HoneyCssAbsoluteDimensionUnit = 'px' | 'cm' | 'mm' | 'in' | 'pt' | 'pc';

/**
 * Represents relative CSS dimension units.
 *
 * These units scale depending on the context.
 *
 * - `'em'` — relative to the font-size of the element
 * - `'rem'` — relative to the font-size of the root element
 * - `'%'` — percentage of the parent element
 * - `'vh'` — 1% of the viewport height
 * - `'vw'` — 1% of the viewport width
 * - `'vmin'` — 1% of the smaller dimension of the viewport
 * - `'vmax'` — 1% of the larger dimension of the viewport
 */
type HoneyCssRelativeDimensionUnit = 'em' | 'rem' | '%' | 'vh' | 'vw' | 'vmin' | 'vmax';

/**
 * Represents any valid CSS dimension unit, including both absolute and relative types.
 */
export type HoneyCssDimensionUnit = HoneyCssAbsoluteDimensionUnit | HoneyCssRelativeDimensionUnit;

/**
 * Represents CSS properties related to spacing and positioning.
 */
export type HoneyCssSpacingProperty = keyof Pick<
  CSS.Properties,
  | 'margin'
  | 'marginTop'
  | 'marginRight'
  | 'marginBottom'
  | 'marginLeft'
  | 'padding'
  | 'paddingTop'
  | 'paddingRight'
  | 'paddingBottom'
  | 'paddingLeft'
  | 'paddingBlock'
  | 'paddingBlockStart'
  | 'paddingBlockEnd'
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'inset'
  | 'gap'
  | 'rowGap'
  | 'columnGap'
>;

/**
 * Represents shorthand spacing properties that support multi-value arrays.
 *
 * These properties accept 2–4 space-separated values
 * to control spacing on multiple sides (e.g., top, right, bottom, left).
 */
export type HoneyCssShorthandSpacingProperty = keyof Pick<
  CSS.Properties,
  'margin' | 'padding' | 'gap'
>;

/**
 * Represents a subset of CSS properties that define color-related styles.
 */
export type HoneyCssColorProperty = keyof Pick<
  CSS.Properties,
  | 'color'
  | 'backgroundColor'
  | 'borderColor'
  | 'borderTopColor'
  | 'borderRightColor'
  | 'borderBottomColor'
  | 'borderLeftColor'
  | 'outlineColor'
  | 'textDecorationColor'
  | 'fill'
  | 'stroke'
>;
