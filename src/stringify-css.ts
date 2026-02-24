import type {
  HoneyCssAstAtRuleNode,
  HoneyCssAstDeclarationNode,
  HoneyCssAstNode,
  HoneyCssAstRuleNode,
  HoneyCssAstStylesheetNode,
} from './types';

/**
 * Converts a declaration node into its compact CSS representation.
 *
 * Behavior:
 * - Trims the declaration value.
 * - Returns an empty string if the value is empty after trimming.
 * - Emits output in compact form: `prop:value;`
 *
 * Example:
 *
 * ```css
 * color: red;
 * ```
 *
 * → `"color:red;"`
 */
const stringifyDeclaration = (node: HoneyCssAstDeclarationNode): string => {
  const value = node.value.trim();
  if (!value) {
    return '';
  }

  return `${node.prop}:${value};`;
};

/**
 * Converts a rule node into its compact CSS representation.
 *
 * Behavior:
 * - Recursively stringifies all child nodes.
 * - Removes the rule entirely if its body becomes empty after child stringification.
 * - Emits output in compact form: `selector{...}`
 *
 * Example:
 *
 * ```css
 * .btn { padding: 8px; }
 * ```
 *
 * → `".btn{padding:8px;}"`
 */
const stringifyRule = (node: HoneyCssAstRuleNode): string => {
  const body = node.body.map(stringifyNode).join('');
  if (!body) {
    return '';
  }

  return `${node.selector}{${body}}`;
};

/**
 * Converts an at-rule node into its compact CSS representation.
 *
 * At-rules are structurally distinguished by the `body` field:
 *
 * - `body === null` → directive-style rule
 *   (e.g. `@charset "UTF-8";`)
 *
 * - `body !== null` → block-style rule
 *   (e.g. `@media (...) { ... }`)
 *
 * Behavior:
 * - Directive rules always emit `@name params;`
 * - Block rules are recursively stringified.
 * - Block rules with an empty resulting body are removed.
 *
 * Examples:
 *
 * ```css
 * @charset "UTF-8";
 * @media (max-width: 768px) { ... }
 * ```
 */
const stringifyAtRule = (node: HoneyCssAstAtRuleNode): string => {
  const params = node.params ? ` ${node.params}` : '';

  if (node.body === null) {
    return `@${node.name}${params};`;
  }

  const body = node.body.map(stringifyNode).join('');
  if (!body) {
    return '';
  }

  return `@${node.name}${params}{${body}}`;
};

/**
 * Converts a single AST node into its compact CSS string representation.
 *
 * This function delegates to the appropriate node-specific stringifier.
 *
 * Unknown node types are ignored and produce an empty string.
 */
const stringifyNode = (node: HoneyCssAstNode): string => {
  switch (node.type) {
    case 'declaration':
      return stringifyDeclaration(node);

    case 'rule':
      return stringifyRule(node);

    case 'atRule':
      return stringifyAtRule(node);

    default:
      return '';
  }
};

/**
 * Converts a Honey CSS AST into a compact CSS string.
 *
 * This is the final stage of the parsing pipeline.
 *
 * Output characteristics:
 * - Fully compact (no extra whitespace)
 * - Preserves structural nesting
 * - Removes empty declarations
 * - Removes empty rules
 * - Removes empty block at-rules
 * - Preserves directive at-rules (`body === null`)
 *
 * The output is deterministic and safe for CSS-in-JS engines and transformation pipelines.
 *
 * @param node - Root stylesheet AST node.
 *
 * @returns Compact CSS string.
 */
export const stringifyCss = (node: HoneyCssAstStylesheetNode): string =>
  node.body.map(stringifyNode).filter(Boolean).join('');
