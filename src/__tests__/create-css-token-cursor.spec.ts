import { createCssTokenCursor } from '../create-css-token-cursor';

describe('[createCssTokenCursor]: token cursor utilities', () => {
  it('should return undefined when peeking an empty token list', () => {
    const cursor = createCssTokenCursor([]);

    expect(cursor.peek()).toBeUndefined();
    expect(cursor.next()).toBeUndefined();

    expect(cursor.isEof()).toBeTruthy();
  });

  it('should allow peeking without consuming tokens', () => {
    const cursor = createCssTokenCursor([{ type: 'braceOpen' }]);

    expect(cursor.peek()).toStrictEqual({ type: 'braceOpen' });
    expect(cursor.peek()).toStrictEqual({ type: 'braceOpen' });

    expect(cursor.isEof()).toBe(false);
  });

  it('should consume tokens sequentially using next()', () => {
    const cursor = createCssTokenCursor([{ type: 'braceOpen' }, { type: 'braceClose' }]);

    expect(cursor.next()).toStrictEqual({ type: 'braceOpen' });
    expect(cursor.next()).toStrictEqual({ type: 'braceClose' });
    expect(cursor.next()).toBeUndefined();

    expect(cursor.isEof()).toBe(true);
  });

  it('should expect the correct token type successfully', () => {
    const cursor = createCssTokenCursor([{ type: 'at' }, { type: 'text', value: 'honey-media' }]);

    expect(cursor.expect('at')).toStrictEqual({ type: 'at' });
    expect(cursor.expect('text')).toStrictEqual({
      type: 'text',
      value: 'honey-media',
    });
  });

  it('should throw when expect() reaches end of input', () => {
    const cursor = createCssTokenCursor([]);

    expect(() => cursor.expect('braceOpen')).toThrow(
      '[@react-hive/honey-css]: Expected "braceOpen" but reached end of input.',
    );
  });

  it('should throw when expect() receives the wrong token type', () => {
    const cursor = createCssTokenCursor([{ type: 'semicolon' }]);

    expect(() => cursor.expect('braceOpen')).toThrow(
      '[@react-hive/honey-css]: Expected "braceOpen" but got "semicolon".',
    );
  });

  it('should read combined text tokens until stop type is reached', () => {
    const cursor = createCssTokenCursor([
      { type: 'text', value: 'color' },
      { type: 'colon' },
      { type: 'text', value: 'red' },
    ]);

    const result = cursor.readUntil(['colon']);

    expect(result).toBe('color');
    expect(cursor.peek()).toStrictEqual({ type: 'colon' });
  });

  it('should include string tokens wrapped in quotes when reading text', () => {
    const cursor = createCssTokenCursor([
      { type: 'text', value: 'content' },
      { type: 'colon' },
      { type: 'string', value: 'hello world' },
      { type: 'semicolon' },
    ]);

    cursor.expect('text');
    cursor.expect('colon');

    const result = cursor.readUntil(['semicolon']);

    expect(result).toBe('"hello world"');
  });

  it('should include params tokens verbatim when reading text', () => {
    const cursor = createCssTokenCursor([
      { type: 'at' },
      { type: 'text', value: 'honey-media' },
      { type: 'params', value: '(sm:down)' },
      { type: 'braceOpen' },
    ]);

    cursor.expect('at');

    const name = cursor.readUntil(['params']);

    expect(name).toBe('honey-media');
    expect(cursor.peek()).toStrictEqual({
      type: 'params',
      value: '(sm:down)',
    });
  });

  it('should stop reading when stop token is encountered immediately', () => {
    const cursor = createCssTokenCursor([{ type: 'braceOpen' }, { type: 'text', value: 'color' }]);

    const result = cursor.readUntil(['braceOpen']);

    expect(result).toBe('');
    expect(cursor.peek()).toStrictEqual({ type: 'braceOpen' });
  });

  it('should trim extra spaces in readUntil result', () => {
    const cursor = createCssTokenCursor([
      { type: 'text', value: '  font-size' },
      { type: 'text', value: '20px  ' },
      { type: 'semicolon' },
    ]);

    const result = cursor.readUntil(['semicolon']);

    expect(result).toBe('font-size 20px');
  });

  it('should advance cursor after readUntil consumption', () => {
    const cursor = createCssTokenCursor([
      { type: 'text', value: 'padding' },
      { type: 'colon' },
      { type: 'text', value: '12px' },
      { type: 'semicolon' },
    ]);

    expect(cursor.readUntil(['colon'])).toBe('padding');

    cursor.expect('colon');

    expect(cursor.readUntil(['semicolon'])).toBe('12px');
    cursor.expect('semicolon');

    expect(cursor.isEof()).toBe(true);
  });

  it('should support nested function params like url(var(--x))', () => {
    const cursor = createCssTokenCursor([
      { type: 'text', value: 'url' },
      { type: 'params', value: '(var(--x))' },
      { type: 'semicolon' },
    ]);

    const result = cursor.readUntil(['semicolon']);

    expect(result).toBe('url(var(--x))');
  });

  it('should ignore unsupported token types inside readUntil', () => {
    const cursor = createCssTokenCursor([
      { type: 'braceOpen' },
      { type: 'text', value: 'color' },
      { type: 'semicolon' },
    ]);

    // braceOpen is unsupported → should not break or include it
    cursor.next();

    const result = cursor.readUntil(['semicolon']);

    expect(result).toBe('color');
  });

  it('should stop reading when cursor reaches EOF', () => {
    const cursor = createCssTokenCursor([
      { type: 'text', value: 'display' },
      { type: 'text', value: 'none' },
    ]);

    const result = cursor.readUntil(['semicolon']);

    expect(result).toBe('display none');
    expect(cursor.isEof()).toBe(true);
  });

  it('should skip tokens until a stop token is reached', () => {
    const cursor = createCssTokenCursor([
      { type: 'text', value: 'color' },
      { type: 'colon' },
      { type: 'text', value: 'red' },
      { type: 'semicolon' },
    ]);

    cursor.skipUntil(['semicolon']);

    expect(cursor.peek()?.type).toBe('semicolon');

    cursor.expect('semicolon');
    expect(cursor.isEof()).toBe(true);
  });

  it('should stop immediately if the first token is already a stop token', () => {
    const cursor = createCssTokenCursor([{ type: 'braceClose' }, { type: 'text', value: 'color' }]);

    cursor.skipUntil(['braceClose']);

    // Should not move at all
    expect(cursor.peek()).toStrictEqual({ type: 'braceClose' });
  });

  it('should safely skip until EOF if stop token is never found', () => {
    const cursor = createCssTokenCursor([
      { type: 'text', value: 'color' },
      { type: 'colon' },
      { type: 'text', value: 'red' },
    ]);

    cursor.skipUntil(['semicolon']);

    // No semicolon exists → cursor should reach EOF
    expect(cursor.isEof()).toBe(true);
    expect(cursor.peek()).toBeUndefined();
  });

  it('should not throw when skipping on an empty token stream', () => {
    const cursor = createCssTokenCursor([]);

    expect(() => cursor.skipUntil(['semicolon'])).not.toThrow();
    expect(cursor.isEof()).toBe(true);
  });

  it('should allow saving and restoring cursor position with mark/reset', () => {
    const cursor = createCssTokenCursor([
      { type: 'text', value: 'color' },
      { type: 'colon' },
      { type: 'text', value: 'red' },
    ]);

    const mark = cursor.mark();

    expect(cursor.next()).toStrictEqual({ type: 'text', value: 'color' });
    expect(cursor.peek()).toStrictEqual({ type: 'colon' });

    cursor.reset(mark);

    // Cursor must return back to the start
    expect(cursor.peek()).toStrictEqual({ type: 'text', value: 'color' });
    expect(cursor.next()).toStrictEqual({ type: 'text', value: 'color' });
  });

  it('should allow marking cursor at EOF safely', () => {
    const cursor = createCssTokenCursor([{ type: 'semicolon' }]);

    cursor.next();
    expect(cursor.isEof()).toBe(true);

    const mark = cursor.mark();

    cursor.reset(mark);

    expect(cursor.isEof()).toBe(true);
    expect(cursor.peek()).toBeUndefined();
  });

  it('should reset cursor and continue consuming correctly', () => {
    const cursor = createCssTokenCursor([
      { type: 'text', value: 'a' },
      { type: 'text', value: 'b' },
      { type: 'text', value: 'c' },
    ]);

    expect(cursor.next()?.value).toBe('a');

    const mark = cursor.mark();

    expect(cursor.next()?.value).toBe('b');
    expect(cursor.next()?.value).toBe('c');

    expect(cursor.isEof()).toBe(true);

    cursor.reset(mark);

    // Should resume from "b"
    expect(cursor.next()?.value).toBe('b');
    expect(cursor.next()?.value).toBe('c');
    expect(cursor.isEof()).toBe(true);
  });
});
