import { readCssSelector } from '../read-css-selector';
import { createCssTokenCursor } from '../create-css-token-cursor';
import { tokenizeCss } from '../tokenize-css';

describe('[readCssSelector]: read raw selector until "{"', () => {
  it('should return empty string at EOF', () => {
    const cursor = createCssTokenCursor([]);

    expect(readCssSelector(cursor)).toBe('');
  });

  it('should read simple class selector', () => {
    const tokens = tokenizeCss(`.btn {}`);
    const cursor = createCssTokenCursor(tokens);

    const result = readCssSelector(cursor);

    expect(result).toBe('.btn');
    expect(cursor.peek()?.type).toBe('braceOpen');
  });

  it('should read id selector', () => {
    const tokens = tokenizeCss(`#app {}`);
    const cursor = createCssTokenCursor(tokens);

    const result = readCssSelector(cursor);

    expect(result).toBe('#app');
  });

  it('should read pseudo selector starting with colon', () => {
    const tokens = tokenizeCss(`:root {}`);
    const cursor = createCssTokenCursor(tokens);

    const result = readCssSelector(cursor);

    expect(result).toBe(':root');
  });

  it('should read double colon pseudo-element', () => {
    const tokens = tokenizeCss(`&::before {}`);
    const cursor = createCssTokenCursor(tokens);

    const result = readCssSelector(cursor);

    expect(result).toBe('&::before');
  });

  it('should read pseudo function selector with params', () => {
    const tokens = tokenizeCss(`li:nth-child(2n+1) {}`);
    const cursor = createCssTokenCursor(tokens);

    const result = readCssSelector(cursor);

    expect(result).toBe('li:nth-child(2n+1)');
  });

  it('should read attribute selector with params token', () => {
    const tokens = tokenizeCss(`&[data-open] {}`);
    const cursor = createCssTokenCursor(tokens);

    const result = readCssSelector(cursor);

    expect(result).toBe('&[data-open]');
  });

  it('should read combinator selector correctly', () => {
    const tokens = tokenizeCss(`> .child {}`);
    const cursor = createCssTokenCursor(tokens);

    const result = readCssSelector(cursor);

    expect(result).toBe('> .child');
  });

  it('should read sibling combinator selector', () => {
    const tokens = tokenizeCss(`& + & {}`);
    const cursor = createCssTokenCursor(tokens);

    const result = readCssSelector(cursor);

    expect(result).toBe('& + &');
  });

  it('should read multiple selectors separated by comma', () => {
    const tokens = tokenizeCss(`.a, .b {}`);
    const cursor = createCssTokenCursor(tokens);

    const result = readCssSelector(cursor);

    expect(result).toBe('.a, .b');
  });

  it('should include string tokens wrapped in quotes', () => {
    const tokens = tokenizeCss(`a[href="test"] {}`);
    const cursor = createCssTokenCursor(tokens);

    const result = readCssSelector(cursor);

    expect(result).toBe('a[href="test"]');
  });

  it('should reconstruct attribute selector even when tokenizer trims spaces', () => {
    const tokens = tokenizeCss(`a[ href = "x" ]{}`);
    const cursor = createCssTokenCursor(tokens);

    expect(readCssSelector(cursor)).toBe(`a[ href ="x"]`);
    expect(cursor.peek()?.type).toBe('braceOpen');
  });

  it('should preserve complex selectors with nested pseudo functions', () => {
    const tokens = tokenizeCss(`button:not(:disabled):is(.a, .b) {}`);
    const cursor = createCssTokenCursor(tokens);

    const result = readCssSelector(cursor);

    expect(result).toBe('button:not(:disabled):is(.a, .b)');
  });

  it('should not consume braceOpen token', () => {
    const tokens = tokenizeCss(`.card {}`);
    const cursor = createCssTokenCursor(tokens);

    readCssSelector(cursor);

    expect(cursor.peek()?.type).toBe('braceOpen');
  });

  it('should stop reading when braceOpen is encountered', () => {
    const tokens = tokenizeCss(`.btn { color: red; }`);
    const cursor = createCssTokenCursor(tokens);

    const result = readCssSelector(cursor);

    expect(result).toBe('.btn');
    expect(cursor.peek()?.type).toBe('braceOpen');
  });

  it('should stop when encountering unsupported token types', () => {
    const tokens = tokenizeCss(`{ color: red; }`);
    const cursor = createCssTokenCursor(tokens);

    expect(readCssSelector(cursor)).toBe('');
  });

  it('should stop reading when braceClose is encountered (safety stop) and not consume it', () => {
    const tokens = tokenizeCss(`.btn } .other {}`);
    const cursor = createCssTokenCursor(tokens);

    const result = readCssSelector(cursor);

    expect(result).toBe('.btn');
    expect(cursor.peek()?.type).toBe('braceClose');
  });

  it('should return empty string when the first token is braceClose', () => {
    const tokens = tokenizeCss(`} .btn {}`);
    const cursor = createCssTokenCursor(tokens);

    const result = readCssSelector(cursor);

    expect(result).toBe('');
    expect(cursor.peek()?.type).toBe('braceClose');
  });
});
