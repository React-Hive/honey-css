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

  let currentQuote: number | null = null;
  let isEscapeSeq = false;

  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);

    if (isEscapeSeq) {
      isEscapeSeq = false;
      continue;
    }

    if (code === 92) {
      // "\"
      isEscapeSeq = true;
      continue;
    }

    // Inside quoted string
    if (currentQuote !== null) {
      if (code === currentQuote) {
        currentQuote = null;
      }
      continue;
    }

    // Enter quoted string
    if (code === 34 || code === 39) {
      currentQuote = code;
      continue;
    }

    // Track nesting
    if (code === 40) {
      // (
      parenDepth++;
      continue;
    }

    if (code === 41) {
      // )
      parenDepth--;
      continue;
    }

    if (code === 91) {
      // [
      bracketDepth++;
      continue;
    }

    if (code === 93) {
      // ]
      bracketDepth--;
      continue;
    }

    // Top-level comma
    if (code === 44 && parenDepth === 0 && bracketDepth === 0) {
      // ,
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

  // Fast path: no comma expansion needed
  const parentHasComma = parentSelector.indexOf(',') !== -1;
  const childHasComma = childSelector.indexOf(',') !== -1;
  const childHasAmp = childSelector.indexOf('&') !== -1;

  if (!parentHasComma && !childHasComma) {
    if (childHasAmp) {
      return childSelector.replaceAll('&', parentSelector);
    }

    return `${parentSelector} ${childSelector}`;
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
