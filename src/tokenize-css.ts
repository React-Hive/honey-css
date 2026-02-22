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
 * This tokenizer is intentionally lightweight and designed for parsing
 * Honey-specific CSS extensions such as:
 *
 * - Custom at-rules: `@honey-media (...) { ... }`
 * - Nested selectors: `&:hover { ... }`
 * - CSS variables: `--primary-color: red;`
 *
 * Supported syntax:
 * - Braces: `{` `}`
 * - Colons and semicolons: `:` `;`
 * - At-rule marker: `@`
 * - Parentheses groups: `(sm:down)`
 * - Quoted strings: `"..."`, `'...'`
 * - Block comments: `/* ... *\/`
 *
 * @param input - Raw CSS string to tokenize.
 *
 * @returns An ordered array of tokens.
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
  const skipComment = (): boolean => {
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
   * Reads plain text until a boundary character is reached.
   *
   * This is used for:
   * - Selectors (`.btn`, `&:hover`)
   * - Property names (`color`)
   * - Values (`red`, `12px`)
   *
   * @returns Trimmed text content.
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

    if (skipComment()) {
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
