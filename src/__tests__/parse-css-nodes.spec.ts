import { parseCssNodes } from '../parse-css-nodes';
import { createCssTokenCursor } from '../create-css-token-cursor';
import { tokenizeCss } from '../tokenize-css';

describe('[parseCssNodes]: parse node sequences', () => {
  it('should return empty array for empty input', () => {
    const tokens = tokenizeCss(``);
    const cursor = createCssTokenCursor(tokens);

    const nodes = parseCssNodes(cursor, {
      stopAtBraceClose: false,
    });

    expect(nodes).toStrictEqual([]);
  });

  it('should parse declarations at root level', () => {
    const tokens = tokenizeCss(`
      color: red;
      padding: 8px;
    `);

    const cursor = createCssTokenCursor(tokens);

    const nodes = parseCssNodes(cursor, {
      stopAtBraceClose: false,
    });

    expect(nodes).toStrictEqual([
      {
        type: 'declaration',
        prop: 'color',
        value: 'red',
      },
      {
        type: 'declaration',
        prop: 'padding',
        value: '8px',
      },
    ]);
  });

  it('should parse rules at root level', () => {
    const tokens = tokenizeCss(`
      .btn { color: red; }
    `);

    const cursor = createCssTokenCursor(tokens);

    const nodes = parseCssNodes(cursor, {
      stopAtBraceClose: false,
    });

    expect(nodes).toStrictEqual([
      {
        type: 'rule',
        selector: '.btn',
        body: [
          {
            type: 'declaration',
            prop: 'color',
            value: 'red',
          },
        ],
      },
    ]);
  });

  it('should parse at-rules at root level', () => {
    const tokens = tokenizeCss(`
      @media (max-width: 600px) {
        display: none;
      }
    `);

    const cursor = createCssTokenCursor(tokens);

    const nodes = parseCssNodes(cursor, {
      stopAtBraceClose: false,
    });

    expect(nodes).toStrictEqual([
      {
        type: 'atRule',
        name: 'media',
        params: '(max-width: 600px)',
        body: [
          {
            type: 'declaration',
            prop: 'display',
            value: 'none',
          },
        ],
      },
    ]);
  });

  it('should stop at braceClose when stopAtBraceClose is true', () => {
    const tokens = tokenizeCss(`
        color: red;
      }
      padding: 8px;
    `);

    const cursor = createCssTokenCursor(tokens);

    const nodes = parseCssNodes(cursor, {
      stopAtBraceClose: true,
    });

    expect(nodes).toStrictEqual([{ type: 'declaration', prop: 'color', value: 'red' }]);

    // Ensure braceClose was consumed
    expect(cursor.peek()?.type).toBe('text');
  });

  it('should not stop at braceClose when stopAtBraceClose is false', () => {
    const tokens = tokenizeCss(`
        color: red;
      }
    `);

    const cursor = createCssTokenCursor(tokens);

    const nodes = parseCssNodes(cursor, {
      stopAtBraceClose: false,
    });

    expect(nodes).toStrictEqual([{ type: 'declaration', prop: 'color', value: 'red' }]);
  });

  it('should skip stray semicolons', () => {
    const tokens = tokenizeCss(`
      ;;;
      color: red;;
    `);

    const cursor = createCssTokenCursor(tokens);

    const nodes = parseCssNodes(cursor, {
      stopAtBraceClose: false,
    });

    expect(nodes).toStrictEqual([{ type: 'declaration', prop: 'color', value: 'red' }]);
  });

  it('should skip invalid standalone colon', () => {
    const tokens = tokenizeCss(`
      color: red;
      :;
      padding: 4px;
    `);

    const cursor = createCssTokenCursor(tokens);

    const nodes = parseCssNodes(cursor, {
      stopAtBraceClose: false,
    });

    expect(nodes).toStrictEqual([
      {
        type: 'declaration',
        prop: 'color',
        value: 'red',
      },
      {
        type: 'declaration',
        prop: 'padding',
        value: '4px',
      },
    ]);
  });

  it('should parse mixed declarations, rules, and at-rules', () => {
    const tokens = tokenizeCss(`
      color: red;
      
      .child {
        padding: 4px;
      }
      
      @layer utilities {
        display: block;
      }
    `);

    const cursor = createCssTokenCursor(tokens);

    const nodes = parseCssNodes(cursor, {
      stopAtBraceClose: false,
    });

    expect(nodes).toStrictEqual([
      { type: 'declaration', prop: 'color', value: 'red' },
      {
        type: 'rule',
        selector: '.child',
        body: [{ type: 'declaration', prop: 'padding', value: '4px' }],
      },
      {
        type: 'atRule',
        name: 'layer',
        params: 'utilities',
        body: [
          {
            type: 'declaration',
            prop: 'display',
            value: 'block',
          },
        ],
      },
    ]);
  });
});
