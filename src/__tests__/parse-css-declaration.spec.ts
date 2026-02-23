import { tokenizeCss } from '../tokenize-css';
import { createCssTokenCursor } from '../create-css-token-cursor';
import { parseCssDeclaration } from '../parse-css-declaration';

describe('[parseCssDeclaration]: parse CSS declaration', () => {
  it('should parse a simple declaration with semicolon', () => {
    const tokens = tokenizeCss(`color: red;`);
    const cursor = createCssTokenCursor(tokens);

    // Skip property name (already parsed by higher-level logic)
    cursor.expect('text');

    const node = parseCssDeclaration(cursor, 'color');

    expect(node).toStrictEqual({
      type: 'declaration',
      prop: 'color',
      value: 'red',
    });

    expect(cursor.isEof()).toBe(true);
  });

  it('should parse declaration without semicolon before braceClose', () => {
    const tokens = tokenizeCss(`color: red}`);
    const cursor = createCssTokenCursor(tokens);

    cursor.expect('text');

    const node = parseCssDeclaration(cursor, 'color');

    expect(node).toStrictEqual({
      type: 'declaration',
      prop: 'color',
      value: 'red',
    });

    // Should NOT consume braceClose
    expect(cursor.peek()?.type).toBe('braceClose');
  });

  it('should parse value with nested params (url + var)', () => {
    const tokens = tokenizeCss(`background: url(var(--img));`);
    const cursor = createCssTokenCursor(tokens);

    cursor.expect('text');

    const node = parseCssDeclaration(cursor, 'background');

    expect(node).toStrictEqual({
      type: 'declaration',
      prop: 'background',
      value: 'url(var(--img))',
    });

    expect(cursor.isEof()).toBe(true);
  });

  it('should parse custom property declaration', () => {
    const tokens = tokenizeCss(`--primary-color: red;`);
    const cursor = createCssTokenCursor(tokens);

    cursor.expect('text');

    const node = parseCssDeclaration(cursor, '--primary-color');

    expect(node).toStrictEqual({
      type: 'declaration',
      prop: '--primary-color',
      value: 'red',
    });
  });

  it('should preserve !important in value', () => {
    const tokens = tokenizeCss(`color: red!important;`);
    const cursor = createCssTokenCursor(tokens);

    cursor.expect('text');

    const node = parseCssDeclaration(cursor, 'color');

    expect(node).toStrictEqual({
      type: 'declaration',
      prop: 'color',
      value: 'red!important',
    });
  });

  it('should parse string values correctly', () => {
    const tokens = tokenizeCss(`content: "hello world";`);
    const cursor = createCssTokenCursor(tokens);

    cursor.expect('text');

    const node = parseCssDeclaration(cursor, 'content');

    expect(node).toStrictEqual({
      type: 'declaration',
      prop: 'content',
      value: '"hello world"',
    });
  });

  it('should stop reading at braceClose without consuming it', () => {
    const tokens = tokenizeCss(`padding: 12px} margin: 8px;`);
    const cursor = createCssTokenCursor(tokens);

    cursor.expect('text');

    const node = parseCssDeclaration(cursor, 'padding');

    expect(node).toStrictEqual({
      type: 'declaration',
      prop: 'padding',
      value: '12px',
    });

    expect(cursor.peek()?.type).toBe('braceClose');
  });

  it('should throw if colon is missing', () => {
    const tokens = tokenizeCss(`color red;`);
    const cursor = createCssTokenCursor(tokens);

    cursor.expect('text');

    expect(() => parseCssDeclaration(cursor, 'color')).toThrow();
  });
});
