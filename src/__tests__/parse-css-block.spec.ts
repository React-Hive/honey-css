import { parseCssBlock } from '../parse-css-block';
import { tokenizeCss } from '../tokenize-css';
import { createCssTokenCursor } from '../create-css-token-cursor';

describe('[parseCssBlock]: parse block contents', () => {
  it('should parse declarations inside a block', () => {
    const tokens = tokenizeCss(`
      {
        color: red;
        padding: 8px;
      }
    `);

    const cursor = createCssTokenCursor(tokens);
    cursor.expect('braceOpen');

    const nodes = parseCssBlock(cursor);

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

  it('should ignore stray semicolons', () => {
    const tokens = tokenizeCss(`
      {
        ;;;
        color: red;;
      }
    `);

    const cursor = createCssTokenCursor(tokens);
    cursor.expect('braceOpen');

    const nodes = parseCssBlock(cursor);

    expect(nodes).toStrictEqual([
      {
        type: 'declaration',
        prop: 'color',
        value: 'red',
      },
    ]);
  });

  it('should parse nested rules', () => {
    const tokens = tokenizeCss(`
      {
        .child {
          color: blue;
        }
      }
    `);

    const cursor = createCssTokenCursor(tokens);
    cursor.expect('braceOpen');

    const nodes = parseCssBlock(cursor);

    expect(nodes).toStrictEqual([
      {
        type: 'rule',
        selector: '.child',
        body: [
          {
            type: 'declaration',
            prop: 'color',
            value: 'blue',
          },
        ],
      },
    ]);
  });

  it('should parse nested at-rules', () => {
    const tokens = tokenizeCss(`
      {
        @media (max-width: 100px) {
          color: red;
        }
      }
    `);

    const cursor = createCssTokenCursor(tokens);
    cursor.expect('braceOpen');

    const nodes = parseCssBlock(cursor);

    expect(nodes).toStrictEqual([
      {
        type: 'atRule',
        name: 'media',
        params: '(max-width: 100px)',
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

  it('should parse mixed declarations, rules, and at-rules', () => {
    const tokens = tokenizeCss(`
      {
        color: red;
        
        .child {
          padding: 4px;
        }
        
        @layer utilities {
          display: block;
        }
      }
    `);

    const cursor = createCssTokenCursor(tokens);
    cursor.expect('braceOpen');

    const nodes = parseCssBlock(cursor);

    expect(nodes).toStrictEqual([
      {
        type: 'declaration',
        prop: 'color',
        value: 'red',
      },
      {
        type: 'rule',
        selector: '.child',
        body: [
          {
            type: 'declaration',
            prop: 'padding',
            value: '4px',
          },
        ],
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

  it('should stop parsing at closing brace', () => {
    const tokens = tokenizeCss(`
      {
        color: red;
      }
      
      .outside {}
    `);

    const cursor = createCssTokenCursor(tokens);
    cursor.expect('braceOpen');

    const nodes = parseCssBlock(cursor);

    expect(nodes).toHaveLength(1);
    expect(nodes).toStrictEqual([
      {
        type: 'declaration',
        prop: 'color',
        value: 'red',
      },
    ]);
  });

  it('should return empty array for empty block', () => {
    const tokens = tokenizeCss(`{}`);

    const cursor = createCssTokenCursor(tokens);
    cursor.expect('braceOpen');

    const nodes = parseCssBlock(cursor);

    expect(nodes).toStrictEqual([]);
  });

  it('should skip unknown tokens gracefully', () => {
    const tokens = tokenizeCss(`
      {
        color: red;
        ???;
        padding: 4px;
      }
    `);

    const cursor = createCssTokenCursor(tokens);
    cursor.expect('braceOpen');

    const nodes = parseCssBlock(cursor);

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
});
