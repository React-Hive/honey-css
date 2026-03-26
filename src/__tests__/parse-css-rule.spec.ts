import { parseCssRule } from '../parse-css-rule';
import { createCssTokenCursor } from '../create-css-token-cursor';
import { tokenizeCss } from '../tokenize-css';

describe('[parseCssRule]: parse rule blocks', () => {
  it('should parse a simple rule with declarations', () => {
    const tokens = tokenizeCss(`
      {
        color: red;
        padding: 8px;
      }
    `);

    const cursor = createCssTokenCursor(tokens);

    const node = parseCssRule(cursor, '.btn');

    expect(node).toStrictEqual({
      type: 'rule',
      selector: '.btn',
      body: [
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
      ],
    });
  });

  it('should parse nested rules inside rule body', () => {
    const tokens = tokenizeCss(`
      {
        .child {
          color: blue;
        }
      }
    `);

    const cursor = createCssTokenCursor(tokens);

    const node = parseCssRule(cursor, '.parent');

    expect(node).toStrictEqual({
      type: 'rule',
      selector: '.parent',
      body: [
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
      ],
    });
  });

  it('should parse nested at-rules inside rule body', () => {
    const tokens = tokenizeCss(`
      {
        @media (max-width: 600px) {
          display: none;
        }
      }
    `);

    const cursor = createCssTokenCursor(tokens);

    const node = parseCssRule(cursor, '.wrapper');

    expect(node).toStrictEqual({
      type: 'rule',
      selector: '.wrapper',
      body: [
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
      ],
    });
  });

  it('should return empty body for empty rule block', () => {
    const tokens = tokenizeCss(`{}`);

    const cursor = createCssTokenCursor(tokens);

    const node = parseCssRule(cursor, '.empty');

    expect(node).toStrictEqual({
      type: 'rule',
      selector: '.empty',
      body: [],
    });
  });

  it('should preserve selector exactly as provided', () => {
    const tokens = tokenizeCss(`
      {
        color: red;
      }
    `);

    const cursor = createCssTokenCursor(tokens);

    const node = parseCssRule(cursor, '.a, .b:hover');

    expect(node.selector).toBe('.a, .b:hover');
  });
});
