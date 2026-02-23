/**
 * Represents a supported string delimiter in CSS.
 *
 * Only single (`'`) and double (`"`) quotes are valid
 * string delimiters in CSS selectors and attribute values.
 */
type QuoteChar = '"' | "'";

/**
 * Iterates over a comma-separated CSS selector list and invokes
 * a callback for each **top-level selector part**.
 *
 * This function safely splits selectors by commas **only at the root level**.
 * It does NOT split when the comma appears inside:
 *
 * - Parentheses — `:is(.a, .b)`
 * - Attribute selectors — `[data-x="a,b"]`
 * - Quoted strings
 * - Escape sequences
 *
 * ---
 *
 * ### Example
 *
 * ```ts
 * forEachTopLevelSelector('.a, .b', cb)
 * // → ".a"
 * // → ".b"
 *
 * forEachTopLevelSelector(':is(.a, .b)', cb)
 * // → ":is(.a, .b)"
 * ```
 *
 * ---
 *
 * ### Parsing Strategy
 *
 * - Tracks nesting depth for:
 *   - `()` parentheses
 *   - `[]` brackets
 * - Tracks active string mode (`'` or `"`)
 * - Handles escape sequences (`\`)
 * - Splits only when encountering a comma at depth 0
 *
 * Empty parts are ignored and not passed to the callback.
 *
 * @param input - The selector list to process.
 * @param callback - Invoked once for each top-level selector.
 */
const forEachTopLevelSelector = (input: string, callback: (part: string) => void) => {
  let start = 0;
  let parenDepth = 0;
  let bracketDepth = 0;

  let currentQuote: QuoteChar | null = null;
  let isEscapeSeq = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (isEscapeSeq) {
      isEscapeSeq = false;
      continue;
    }

    if (char === '\\') {
      isEscapeSeq = true;
      continue;
    }

    if (currentQuote) {
      if (char === currentQuote) {
        currentQuote = null;
      }

      continue;
    }

    if (char === '"' || char === "'") {
      currentQuote = char;
      continue;
    }

    switch (char) {
      case '(':
        parenDepth++;
        break;
      case ')':
        parenDepth--;
        break;
      case '[':
        bracketDepth++;
        break;
      case ']':
        bracketDepth--;
        break;
    }

    if (char === ',' && parenDepth === 0 && bracketDepth === 0) {
      const part = input.slice(start, i).trim();
      if (part) {
        callback(part);
      }

      start = i + 1;
    }
  }

  const last = input.slice(start).trim();
  if (last) {
    callback(last);
  }
};

/**
 * Resolves a nested CSS selector against a parent selector.
 *
 * Performs full cartesian expansion of comma-separated selector lists
 * and supports explicit parent references using `&`.
 *
 * ---
 *
 * ### Resolution Rules
 *
 * - If the child selector contains `&`,
 *   every `&` is replaced with the parent selector.
 *
 * - Otherwise, a descendant relationship is created:
 *
 *   ```
 *   parent child
 *   ```
 *
 * - Supports comma-separated lists on both parent and child.
 * - Preserves complex selectors including:
 *   - Pseudo-classes (`:hover`)
 *   - Pseudo-elements (`::before`)
 *   - Attribute selectors (`[data-x="a,b"]`)
 *   - Nested functions (`:is(...)`, `:not(...)`)
 *
 * ---
 *
 * ### Examples
 *
 * ```ts
 * resolveCssSelector('.child', '.scope')
 * // → ".scope .child"
 *
 * resolveCssSelector('&:hover', '.btn')
 * // → ".btn:hover"
 *
 * resolveCssSelector('.a, .b', '.scope')
 * // → ".scope .a, .scope .b"
 *
 * resolveCssSelector('& + &', '.item')
 * // → ".item + .item"
 *
 * resolveCssSelector('.x, .y', '.a, .b')
 * // → ".a .x, .a .y, .b .x, .b .y"
 * ```
 *
 * ---
 *
 * @param selector - The nested (child) selector.
 * @param parent - The parent selector used for scoping.
 *
 * @returns The fully resolved selector string.
 */
export const resolveCssSelector = (selector: string, parent: string): string => {
  const childSelector = selector.trim();
  if (!childSelector) {
    return '';
  }

  const parentSelector = parent.trim();
  if (!parentSelector) {
    return childSelector;
  }

  const result: string[] = [];

  forEachTopLevelSelector(parentSelector, parentPart => {
    forEachTopLevelSelector(childSelector, childPart => {
      if (childPart.includes('&')) {
        result.push(childPart.replaceAll('&', parentPart));
      } else {
        result.push(`${parentPart} ${childPart}`);
      }
    });
  });

  return result.join(', ');
};
