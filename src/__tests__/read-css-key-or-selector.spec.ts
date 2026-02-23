import { readCssKeyOrSelector } from '../read-css-key-or-selector';
import { createCssTokenCursor } from '../create-css-token-cursor';
import { tokenizeCss } from '../tokenize-css';

describe('[readCssKeyOrSelector]: read selector or declaration key', () => {
  it('should return empty string when cursor is at EOF', () => {
    const cursor = createCssTokenCursor([]);

    expect(readCssKeyOrSelector(cursor)).toBe('');
  });

  it('should read declaration property name correctly', () => {
    const tokens = tokenizeCss(`color: red;`);
    const cursor = createCssTokenCursor(tokens);

    const result = readCssKeyOrSelector(cursor);

    expect(result).toBe('color');
    expect(cursor.peek()?.type).toBe('colon');
  });

  it('should treat ".class" as selector and not consume braceOpen', () => {
    const tokens = tokenizeCss(`.btn { color: red; }`);
    const cursor = createCssTokenCursor(tokens);

    const result = readCssKeyOrSelector(cursor);

    expect(result).toBe('.btn');
    // selector accepted, but "{" must remain unconsumed
    expect(cursor.peek()?.type).toBe('braceOpen');
  });

  it('should treat "#id" as selector', () => {
    const tokens = tokenizeCss(`#burger-btn { display: none; }`);
    const cursor = createCssTokenCursor(tokens);

    const result = readCssKeyOrSelector(cursor);

    expect(result).toBe('#burger-btn');
    expect(cursor.peek()?.type).toBe('braceOpen');
  });

  it('should treat "&:hover" as selector', () => {
    const tokens = tokenizeCss(`&:hover { opacity: 0.5; }`);
    const cursor = createCssTokenCursor(tokens);

    const result = readCssKeyOrSelector(cursor);

    expect(result).toBe('&:hover');
    expect(cursor.peek()?.type).toBe('braceOpen');
  });

  it('should treat attribute selectors as selector', () => {
    const tokens = tokenizeCss(`&[data-open] { opacity: 1; }`);
    const cursor = createCssTokenCursor(tokens);

    const result = readCssKeyOrSelector(cursor);

    expect(result).toBe('&[data-open]');
    expect(cursor.peek()?.type).toBe('braceOpen');
  });

  it('should treat quoted attribute selectors correctly', () => {
    const tokens = tokenizeCss(`a[href="x"] { color: red; }`);
    const cursor = createCssTokenCursor(tokens);

    const result = readCssKeyOrSelector(cursor);

    expect(result).toBe(`a[href="x"]`);
    expect(cursor.peek()?.type).toBe('braceOpen');
  });

  it('should treat child combinator selectors as selector', () => {
    const tokens = tokenizeCss(`> .content { width: 100%; }`);
    const cursor = createCssTokenCursor(tokens);

    const result = readCssKeyOrSelector(cursor);

    expect(result).toBe('> .content');
    expect(cursor.peek()?.type).toBe('braceOpen');
  });

  it('should treat ":root" selector correctly when starting with colon token', () => {
    const tokens = tokenizeCss(`:root { --primary: red; }`);
    const cursor = createCssTokenCursor(tokens);

    const result = readCssKeyOrSelector(cursor);

    expect(result).toBe(':root');
    expect(cursor.peek()?.type).toBe('braceOpen');
  });

  it('should treat pseudo selectors like ":hover" correctly', () => {
    const tokens = tokenizeCss(`:hover { opacity: 0.8; }`);
    const cursor = createCssTokenCursor(tokens);

    const result = readCssKeyOrSelector(cursor);

    expect(result).toBe(':hover');
    expect(cursor.peek()?.type).toBe('braceOpen');
  });

  it('should return empty string for unsupported token types', () => {
    const tokens = tokenizeCss(`{ color: red; }`);
    const cursor = createCssTokenCursor(tokens);

    expect(readCssKeyOrSelector(cursor)).toBe('');
  });

  it('should not treat normal property names starting with letters as selector', () => {
    const tokens = tokenizeCss(`padding: 12px;`);
    const cursor = createCssTokenCursor(tokens);

    const result = readCssKeyOrSelector(cursor);

    expect(result).toBe('padding');
    expect(cursor.peek()?.type).toBe('colon');
  });

  it('should treat sibling selectors "& + &" as selector', () => {
    const tokens = tokenizeCss(`& + & { margin-top: 12px; }`);
    const cursor = createCssTokenCursor(tokens);

    const result = readCssKeyOrSelector(cursor);

    expect(result).toBe('& + &');
    expect(cursor.peek()?.type).toBe('braceOpen');
  });

  it('should treat multiple selectors ".a, .b" as selector', () => {
    const tokens = tokenizeCss(`.a, .b { color: red; }`);
    const cursor = createCssTokenCursor(tokens);

    const result = readCssKeyOrSelector(cursor);

    expect(result).toBe('.a, .b');
    expect(cursor.peek()?.type).toBe('braceOpen');
  });

  it('should treat complex selectors with :not() correctly', () => {
    const tokens = tokenizeCss(`button:not(:disabled) { opacity: 0.5; }`);
    const cursor = createCssTokenCursor(tokens);

    const result = readCssKeyOrSelector(cursor);

    expect(result).toBe('button:not(:disabled)');
    expect(cursor.peek()?.type).toBe('braceOpen');
  });

  it('should treat "::before" pseudo-element selector correctly', () => {
    const tokens = tokenizeCss(`&::before { content: ""; }`);
    const cursor = createCssTokenCursor(tokens);

    const result = readCssKeyOrSelector(cursor);

    expect(result).toBe('&::before');
    expect(cursor.peek()?.type).toBe('braceOpen');
  });

  it('should treat "::after" pseudo-element selector correctly', () => {
    const tokens = tokenizeCss(`&::after { content: ""; }`);
    const cursor = createCssTokenCursor(tokens);

    const result = readCssKeyOrSelector(cursor);

    expect(result).toBe('&::after');
    expect(cursor.peek()?.type).toBe('braceOpen');
  });

  it('should support nested pseudo functions like :nth-child()', () => {
    const tokens = tokenizeCss(`li:nth-child(2n+1) { color: red; }`);
    const cursor = createCssTokenCursor(tokens);

    const result = readCssKeyOrSelector(cursor);

    expect(result).toBe('li:nth-child(2n+1)');
    expect(cursor.peek()?.type).toBe('braceOpen');
  });

  it('should treat "a:hover: 1;" as a declaration key "a" (colon ends the key)', () => {
    const tokens = tokenizeCss(`a:hover: 1;`);
    const cursor = createCssTokenCursor(tokens);

    const result = readCssKeyOrSelector(cursor);

    expect(result).toBe('a');
    expect(cursor.peek()?.type).toBe('colon');
  });

  it('should stop fallback key reading before "@" token (do not swallow at-rules)', () => {
    // If parser is in a weird state, we still should not read into "@media"
    const tokens = tokenizeCss(`color @media (min-width: 1px) {}`);
    const cursor = createCssTokenCursor(tokens);

    const result = readCssKeyOrSelector(cursor);

    expect(result).toBe('color');
    expect(cursor.peek()?.type).toBe('at');
  });

  it('should treat custom property name as declaration key', () => {
    const tokens = tokenizeCss(`--primary-color: red;`);
    const cursor = createCssTokenCursor(tokens);

    const result = readCssKeyOrSelector(cursor);

    expect(result).toBe('--primary-color');
    expect(cursor.peek()?.type).toBe('colon');
  });

  it('should return empty string when next token is braceClose (common parse recovery scenario)', () => {
    const tokens = tokenizeCss(`}`);
    const cursor = createCssTokenCursor(tokens);

    expect(readCssKeyOrSelector(cursor)).toBe('');
    expect(cursor.peek()?.type).toBe('braceClose');
  });
});
