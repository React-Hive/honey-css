import type { HoneyCssAstRuleNode } from './types';
import type { HoneyTokenCursor } from './create-css-token-cursor';
import { parseCssBlock } from './parse-css-block';

/**
 * Parses a CSS rule block for a given selector.
 *
 * The cursor must be positioned at a `{` token that begins the rule body.
 *
 * This function:
 * - Consumes the opening `{`
 * - Delegates parsing of the rule contents to {@link parseCssBlock}
 * - Returns a complete `rule` AST node
 *
 * It does not:
 * - Parse or validate the selector
 * - Resolve nested selectors
 * - Perform any transformations
 *
 * Example:
 *
 * ```css
 * .btn {
 *   color: red;
 *   .icon { opacity: 0.5; }
 * }
 * ```
 *
 * Produces:
 *
 * ```ts
 * {
 *   type: 'rule',
 *   selector: '.btn',
 *   body: [...]
 * }
 * ```
 *
 * @param cursor - Token cursor positioned at the opening `{` of the rule
 * @param selector - Raw selector string associated with the rule
 *
 * @returns A parsed {@link HoneyCssAstRuleNode}
 */
export const parseCssRule = (cursor: HoneyTokenCursor, selector: string): HoneyCssAstRuleNode => {
  cursor.expect('braceOpen');

  return {
    type: 'rule',
    selector,
    body: parseCssBlock(cursor),
  };
};
