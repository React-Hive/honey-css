import type { HoneyCssAstStylesheetNode } from './types';
import { tokenizeCss } from './tokenize-css';
import { createCssTokenCursor } from './create-css-token-cursor';
import { parseCssNodes } from './parse-css-nodes';

/**
 * Parses a full CSS source string into a Honey stylesheet AST.
 *
 * This is the main entry point of the parsing pipeline:
 *
 * 1. Tokenizes the raw CSS input.
 * 2. Creates a token cursor for controlled traversal.
 * 3. Parses root-level nodes using {@link parseCssNodes}.
 *
 * Root-level parsing does not treat `}` as a structural boundary,
 * unlike block parsing. All top-level rules, declarations, and
 * at-rules are collected until EOF.
 *
 * The returned AST is structural:
 * - No selector resolution is performed.
 * - No AST normalization or cleanup occurs.
 * - Empty nodes are preserved as parsed.
 *
 * Example:
 *
 * ```ts
 * const ast = parseCss(`
 *   .btn {
 *     color: red;
 *   }
 * `);
 * ```
 *
 * @param input - Raw CSS source string
 *
 * @returns Parsed {@link HoneyCssAstStylesheetNode}
 */
export const parseCss = (input: string): HoneyCssAstStylesheetNode => {
  const tokens = tokenizeCss(input);
  const cursor = createCssTokenCursor(tokens);

  return {
    type: 'stylesheet',
    body: parseCssNodes(cursor, {
      stopAtBraceClose: false,
    }),
  };
};
