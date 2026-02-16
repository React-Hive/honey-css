import { assert } from '@react-hive/honey-utils';

import type { HoneyCssToken, HoneyCssTokenType } from '~/types';

/**
 * A lightweight cursor abstraction over a token stream.
 *
 * This is the core navigation primitive used by the Honey CSS parser.
 * It provides safe sequential reading, lookahead, backtracking,
 * and small helper utilities for collecting selector/value text.
 */
export interface HoneyTokenCursor {
  /**
   * Returns `true` when the cursor has consumed all tokens.
   */
  isEof: () => boolean;
  /**
   * Returns the current token without consuming it.
   *
   * This is primarily used for lookahead decisions in the parser:
   *
   * ```ts
   * if (cursor.peek()?.type === 'braceOpen') {
   *   // parse rule block
   * }
   * ```
   */
  peek: () => HoneyCssToken | undefined;
  /**
   * Consumes and returns the current token, advancing the cursor forward.
   *
   * Returns `undefined` if the cursor is already at EOF.
   *
   * ```ts
   * const token = cursor.next();
   * ```
   */
  next: () => HoneyCssToken | undefined;
  /**
   * Creates a checkpoint of the current cursor position.
   *
   * Useful for speculative parsing or backtracking:
   *
   * ```ts
   * const mark = cursor.mark();
   *
   * if (!tryParseSomething(cursor)) {
   *   cursor.reset(mark);
   * }
   * ```
   */
  mark: () => number;
  /**
   * Restores the cursor back to a previously created mark.
   *
   * @param mark - Index returned from {@link mark}.
   */
  reset: (mark: number) => void;
  /**
   * Consumes the next token and asserts that it matches the expected type.
   *
   * This is the parser's main safety mechanism and helps produce
   * clear error messages during invalid input.
   *
   * Throws if:
   * - the token stream ends unexpectedly
   * - the next token has a different type
   *
   * ```ts
   * cursor.expect('braceOpen'); // must be "{"
   * ```
   *
   * @param type - Expected token type.
   *
   * @returns The consumed token, narrowed to the expected type.
   */
  expect: <T extends HoneyCssTokenType>(type: T) => Extract<HoneyCssToken, { type: T }>;
  /**
   * Reads and concatenates consecutive token values until one of the stop token
   * types is encountered.
   *
   * This helper is used to collect:
   * - selectors (`.btn:hover`)
   * - declaration values (`calc(100% - 1px)`)
   * - at-rule names (`media`)
   *
   * Stops **before consuming** the stop token.
   *
   * Supported token types:
   * - `text`   → appended as-is
   * - `string` → wrapped in quotes
   * - `params` → appended verbatim including parentheses
   *
   * Example:
   *
   * Tokens:
   * ```
   * text("var")
   * params("(--color)")
   * ```
   *
   * Result:
   * ```
   * "var(--color)"
   * ```
   *
   * @param stopTypes - Token types that terminate reading.
   *
   * @returns Combined string value.
   */
  readUntil: (stopTypes: HoneyCssTokenType[]) => string;
  /**
   * Advances the cursor until one of the stop token types is reached.
   *
   * This is useful for error recovery and safely skipping unknown syntax.
   *
   * Stops before consuming the stop token.
   *
   * @param stopTypes - Token types that terminate skipping.
   */
  skipUntil: (stopTypes: HoneyCssTokenType[]) => void;
}

/**
 * Creates a cursor wrapper around a list of CSS tokens.
 *
 * The cursor provides a small API surface for building
 * recursive-descent parsers without needing complex parser generators.
 *
 * @param tokens - Token list produced by the Honey tokenizer.
 *
 * @returns A reusable cursor instance.
 */
export const createCssTokenCursor = (tokens: HoneyCssToken[]): HoneyTokenCursor => {
  let index = 0;

  const isEof = (): boolean => index >= tokens.length;

  const peek = (): HoneyCssToken | undefined => (isEof() ? undefined : tokens[index]);

  const next = (): HoneyCssToken | undefined => (isEof() ? undefined : tokens[index++]);

  const mark = (): number => index;

  const reset = (mark: number): void => {
    index = mark;
  };

  const expect = <T extends HoneyCssTokenType>(type: T): Extract<HoneyCssToken, { type: T }> => {
    const token = next();

    assert(token, `[@react-hive/honey-css]: Expected "${type}" but reached end of input.`);
    assert(
      token.type === type,
      `[@react-hive/honey-css]: Expected "${type}" but got "${token.type}".`,
    );

    return token as Extract<HoneyCssToken, { type: T }>;
  };

  const readUntil = (stopTypes: HoneyCssTokenType[]): string => {
    let result = '';

    while (!isEof()) {
      const token = peek();

      if (!token || stopTypes.includes(token.type)) {
        break;
      }

      if (token.type === 'text') {
        if (result) {
          result += ' ';
        }

        result += token.value;
        //
      } else if (token.type === 'string') {
        result += `"${token.value}"`;
        //
      } else if (token.type === 'params') {
        result += token.value;
      }

      next();
    }

    return result.trim();
  };

  const skipUntil = (stopTypes: HoneyCssTokenType[]): void => {
    while (!isEof()) {
      const token = peek();

      if (!token || stopTypes.includes(token.type)) {
        break;
      }

      next();
    }
  };

  return {
    isEof,
    peek,
    next,
    mark,
    reset,
    expect,
    readUntil,
    skipUntil,
  };
};
