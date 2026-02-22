import type { HoneyCssToken } from './types';

/**
 * Determines whether a character should terminate a plain text read.
 *
 * These characters represent structural boundaries in CSS:
 * - Blocks: `{` `}`
 * - Declarations: `:` `;`
 * - At-rules: `@`
 * - Params: `(`
 * - Strings: `'` `"`
 * - Comments: `/`
 */
const isBoundaryChar = (ch: string): boolean =>
  ch === '{' ||
  ch === '}' ||
  ch === ':' ||
  ch === ';' ||
  ch === '@' ||
  ch === '(' ||
  ch === '"' ||
  ch === "'" ||
  ch === '/';

/**
 * Tokenizes a CSS-like input string into a sequence of Honey CSS tokens.
 *
 * This function is the first stage of the Honey CSS compilation pipeline.
 * It performs a single-pass lexical scan and produces a flat stream of tokens
 * that can later be consumed by the recursive-descent parser.
 *
 * Unlike a strict CSS tokenizer, this implementation is intentional:
 *
 * - Lightweight (no external dependencies)
 * - Tolerant (fails safely on malformed input)
 * - Extended for CSS-in-JS use cases
 *
 * In addition to standard CSS constructs, it supports:
 *
 * - Custom at-rules (`@honey-media`, `@honey-stack`, etc.)
 * - Nested selectors (`&:hover`, `& > .child`)
 * - CSS variables (`--color: red`)
 * - JavaScript-style single-line comments (`// comment`)
 * - Multiline block comments (`/* comment *\/`)
 * - Nested parentheses groups (`calc(...)`, `var(...)`)
 * - Escaped characters inside strings
 *
 * The tokenizer:
 *
 * - Skips all whitespace
 * - Skips both block (`/* *\/`) and single-line (`//`) comments
 * - Preserves balanced parentheses as a single `params` token
 * - Preserves quoted strings as `string` tokens (without quotes)
 * - Emits structural tokens (`braceOpen`, `braceClose`, `colon`, `semicolon`, `at`)
 * - Emits all other text as trimmed `text` tokens
 *
 * Safety guarantees:
 *
 * - Unterminated comments do not crash tokenization
 * - Unterminated strings do not throw
 * - Infinite loops are prevented by fallback index advancement
 *
 * The returned token stream is order-preserving and does not perform
 * semantic validation. Structural correctness is handled by the parser stage.
 *
 * @param input - Raw CSS string to tokenize.
 *
 * @returns Ordered array of {@link HoneyCssToken} objects.
 */
export const tokenizeCss = (input: string): HoneyCssToken[] => {
  const tokens: HoneyCssToken[] = [];

  let index = 0;

  const isEof = (): boolean => index >= input.length;

  /**
   * Returns the current character without consuming it.
   */
  const peek = (): string | undefined => (isEof() ? undefined : input[index]);

  /**
   * Returns the next character without consuming it.
   */
  const peekNext = (): string | undefined =>
    index + 1 >= input.length ? undefined : input[index + 1];

  /**
   * Advances the cursor past any whitespace characters.
   */
  const skipWhitespace = () => {
    while (true) {
      const ch = peek();

      if (!ch || !/\s/.test(ch)) {
        return;
      }

      index++;
    }
  };

  /**
   * Skips JavaScript-style single-line comments of the form:
   *
   * ```css
   * // comment text
   * ```
   *
   * This syntax is not part of standard CSS,
   * but is commonly used in CSS-in-JS template literals.
   *
   * The comment is skipped until a newline character (`\n`)
   * or the end of input is reached.
   *
   * If the comment is unterminated (EOF without newline),
   * tokenization safely stops at the end of the input.
   *
   * @returns `true` if a single-line comment was detected and skipped,
   * otherwise `false`.
   */
  const skipSingleLineComment = (): boolean => {
    if (peek() !== '/' || peekNext() !== '/') {
      return false;
    }

    index += 2; // skip "//"

    while (!isEof()) {
      const ch = peek();

      if (ch === '\n') {
        index++; // consume newline
        break;
      }

      index++;
    }

    return true;
  };

  /**
   * Skips CSS block comments of the form:
   *
   * ```css
   * /* comment *\/
   * ```
   *
   * If the comment is unterminated, tokenization stops safely.
   *
   * @returns `true` if a comment was skipped.
   */
  const skipMultiLineComment = (): boolean => {
    if (peek() !== '/' || peekNext() !== '*') {
      return false;
    }

    index += 2; // skip "/*"

    while (!isEof()) {
      if (peek() === '*' && peekNext() === '/') {
        index += 2; // skip "*/"

        return true;
      }

      index++;
    }

    return true;
  };

  /**
   * Reads a quoted string token.
   *
   * Supports:
   * - Double quotes: `"text"`
   * - Single quotes: `'text'`
   * - Escaped characters: `"a\\\"b"`
   *
   * @returns The unwrapped string contents.
   */
  const readString = (): string => {
    const quote = peek();
    if (!quote) {
      return '';
    }

    index++; // skip opening quote
    let result = '';

    while (!isEof()) {
      const ch = peek();
      if (!ch) {
        break;
      }

      // Handle escape sequences
      if (ch === '\\') {
        result += ch;
        index++;

        const escaped = peek();
        if (escaped) {
          result += escaped;
          index++;
        }

        continue;
      }

      // Closing quote
      if (ch === quote) {
        index++;
        break;
      }

      result += ch;
      index++;
    }

    return result;
  };

  /**
   * Reads a balanced parentheses group.
   *
   * Examples:
   * - `(sm:down)`
   * - `(min-width: calc(100% - 1px))`
   *
   * Nested parentheses are supported.
   *
   * @returns The full params string including parentheses.
   */
  const readParamsGroup = (): string => {
    let depth = 0;
    let result = '';

    while (!isEof()) {
      const ch = peek();
      if (!ch) {
        break;
      }

      if (ch === '(') {
        depth++;
      }

      if (ch === ')') {
        depth--;
      }

      result += ch;
      index++;

      if (depth === 0) {
        break;
      }
    }

    return result;
  };

  /**
   * Reads a contiguous plain-text segment until a structural boundary
   * character is encountered.
   *
   * This function is responsible for collecting free-form CSS text such as:
   *
   * - Selectors (`.btn`, `&:hover`, `.parent > .child`)
   * - Property names (`color`, `border-bottom-width`)
   * - Values (`red`, `12px`, `100%`, `red!important`)
   *
   * Reading stops when a boundary character is reached.
   * Boundary characters represent structural syntax in CSS and include:
   *
   * - Block delimiters: `{` `}`
   * - Declaration delimiters: `:` `;`
   * - At-rule marker: `@`
   * - Parentheses start: `(`
   * - String delimiters: `'` `"`
   * - Comment initiator: `/`
   *
   * The boundary character itself is NOT consumed here —
   * it is handled separately by the main tokenizer loop.
   *
   * The returned value is trimmed to remove leading/trailing whitespace,
   * ensuring clean token values without altering internal spacing.
   *
   * Safety:
   * - Stops at EOF safely
   * - Never throws
   * - Prevents infinite loops via boundary checks
   *
   * @returns Trimmed text segment, or an empty string if no text was read.
   */
  const readText = (): string => {
    let result = '';

    while (!isEof()) {
      const ch = peek();
      if (!ch) {
        break;
      }

      if (isBoundaryChar(ch)) {
        break;
      }

      result += ch;
      index++;
    }

    return result.trim();
  };

  // ============================
  // Main Token Loop
  // ============================
  while (!isEof()) {
    skipWhitespace();

    if (isEof()) {
      break;
    }

    if (skipSingleLineComment() || skipMultiLineComment()) {
      continue;
    }

    const ch = peek();
    if (!ch) {
      break;
    }

    if (ch === '{') {
      tokens.push({
        type: 'braceOpen',
      });

      index++;
      continue;
    }

    if (ch === '}') {
      tokens.push({
        type: 'braceClose',
      });

      index++;
      continue;
    }

    if (ch === ':') {
      tokens.push({
        type: 'colon',
      });

      index++;
      continue;
    }

    if (ch === ';') {
      tokens.push({
        type: 'semicolon',
      });

      index++;
      continue;
    }

    if (ch === '@') {
      tokens.push({
        type: 'at',
      });

      index++;
      continue;
    }

    // Params group
    if (ch === '(') {
      tokens.push({
        type: 'params',
        value: readParamsGroup(),
      });

      continue;
    }

    // Strings
    if (ch === '"' || ch === "'") {
      tokens.push({
        type: 'string',
        value: readString(),
      });

      continue;
    }

    // Text chunk
    const value = readText();
    if (value) {
      tokens.push({
        type: 'text',
        value,
      });
    } else {
      // Safety fallback to prevent infinite loops
      index++;
    }
  }

  return tokens;
};
