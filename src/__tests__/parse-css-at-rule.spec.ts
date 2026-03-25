import { parseCssAtRule } from '../parse-css-at-rule';
import { createCssTokenCursor } from '../create-css-token-cursor';
import { tokenizeCss } from '../tokenize-css';

describe('[parseCssAtRule]: parse CSS @-rule', () => {
  it('should parse directive at-rule without params', () => {
    const node = parseCssAtRule(createCssTokenCursor(tokenizeCss(`@charset;`)));

    expect(node).toStrictEqual({
      type: 'atRule',
      name: 'charset',
      params: undefined,
      body: null,
    });
  });

  it('should parse directive at-rule with params (@import)', () => {
    const node = parseCssAtRule(createCssTokenCursor(tokenizeCss(`@import url("file.css");`)));

    expect(node).toStrictEqual({
      type: 'atRule',
      name: 'import',
      params: 'url("file.css")',
      body: null,
    });
  });

  it('should parse block at-rule without params', () => {
    const node = parseCssAtRule(
      createCssTokenCursor(
        tokenizeCss(`
          @honey-stack {
            display: flex;
          }
        `),
      ),
    );

    expect(node).toStrictEqual({
      type: 'atRule',
      name: 'honey-stack',
      params: undefined,
      body: [{ type: 'declaration', prop: 'display', value: 'flex' }],
    });
  });

  it('should parse block at-rule with params', () => {
    const node = parseCssAtRule(
      createCssTokenCursor(
        tokenizeCss(`
          @media (max-width: 100px) {}
        `),
      ),
    );

    expect(node).toStrictEqual({
      type: 'atRule',
      name: 'media',
      params: '(max-width: 100px)',
      body: [],
    });
  });

  it('should parse block at-rule with params and declarations', () => {
    const node = parseCssAtRule(
      createCssTokenCursor(
        tokenizeCss(`
          @honey-media (sm:down) {
            color: red;
          }
        `),
      ),
    );

    expect(node).toStrictEqual({
      type: 'atRule',
      name: 'honey-media',
      params: '(sm:down)',
      body: [{ type: 'declaration', prop: 'color', value: 'red' }],
    });
  });

  it('should support nested rules inside at-rule', () => {
    const node = parseCssAtRule(
      createCssTokenCursor(
        tokenizeCss(`
          @honey-media (sm:down) {
            .child {
              padding: 8px;
            }
          }
        `),
      ),
    );

    expect(node.body).toStrictEqual([
      {
        type: 'rule',
        selector: '.child',
        body: [{ type: 'declaration', prop: 'padding', value: '8px' }],
      },
    ]);
  });

  it('should support nested at-rules inside at-rule', () => {
    const node = parseCssAtRule(
      createCssTokenCursor(
        tokenizeCss(`
          @honey-media (sm:down) {
            @honey-media (xs:down) {
              opacity: 0.5;
            }
          }
        `),
      ),
    );

    expect(node.body).toStrictEqual([
      {
        type: 'atRule',
        name: 'honey-media',
        params: '(xs:down)',
        body: [{ type: 'declaration', prop: 'opacity', value: '0.5' }],
      },
    ]);
  });

  it('should support mixed sibling nodes inside at-rule body', () => {
    const node = parseCssAtRule(
      createCssTokenCursor(
        tokenizeCss(`
          @honey-media (sm:down) {
            color: red;
            .child { padding: 8px; }
          }
        `),
      ),
    );

    expect(node.body).toStrictEqual([
      { type: 'declaration', prop: 'color', value: 'red' },
      {
        type: 'rule',
        selector: '.child',
        body: [{ type: 'declaration', prop: 'padding', value: '8px' }],
      },
    ]);
  });

  it('should parse vendor pseudo-element rule inside @honey-media block', () => {
    const node = parseCssAtRule(
      createCssTokenCursor(
        tokenizeCss(`
          @honey-media (sm:up) {
            ::-webkit-scrollbar {
              width: 11px;
              height: 11px;
            }
          }
        `),
      ),
    );

    expect(node).toStrictEqual({
      type: 'atRule',
      name: 'honey-media',
      params: '(sm:up)',
      body: [
        {
          type: 'rule',
          selector: '::-webkit-scrollbar',
          body: [
            { type: 'declaration', prop: 'width', value: '11px' },
            { type: 'declaration', prop: 'height', value: '11px' },
          ],
        },
      ],
    });
  });

  it('should parse @keyframes with animation name', () => {
    const node = parseCssAtRule(
      createCssTokenCursor(
        tokenizeCss(`
          @keyframes spin {
            0% { opacity: 0; }
          }
        `),
      ),
    );

    expect(node).toStrictEqual({
      type: 'atRule',
      name: 'keyframes',
      params: 'spin',
      body: [
        {
          type: 'rule',
          selector: '0%',
          body: [{ type: 'declaration', prop: 'opacity', value: '0' }],
        },
      ],
    });
  });

  it('should parse @keyframes without animation name', () => {
    const node = parseCssAtRule(
      createCssTokenCursor(
        tokenizeCss(`
          @keyframes {
            0% { opacity: 0; }
          }
        `),
      ),
    );

    expect(node.params).toBeUndefined();
  });

  it('should parse @layer block form', () => {
    const node = parseCssAtRule(
      createCssTokenCursor(
        tokenizeCss(`
          @layer utilities {
            color: red;
          }
        `),
      ),
    );

    expect(node).toStrictEqual({
      type: 'atRule',
      name: 'layer',
      params: 'utilities',
      body: [{ type: 'declaration', prop: 'color', value: 'red' }],
    });
  });

  it('should parse @layer directive form', () => {
    const node = parseCssAtRule(createCssTokenCursor(tokenizeCss(`@layer base, components;`)));

    expect(node).toStrictEqual({
      type: 'atRule',
      name: 'layer',
      params: 'base, components',
      body: null,
    });
  });

  it('should parse space-delimited header correctly', () => {
    const node = parseCssAtRule(
      createCssTokenCursor(
        tokenizeCss(`
          @counter-style custom {
            system: cyclic;
          }
        `),
      ),
    );

    expect(node.name).toBe('counter-style');
    expect(node.params).toBe('custom');
  });

  it('should parse @scope block form', () => {
    const node = parseCssAtRule(
      createCssTokenCursor(
        tokenizeCss(`
          @scope (.card) {
            color: red;
          }
        `),
      ),
    );

    expect(node).toStrictEqual({
      type: 'atRule',
      name: 'scope',
      params: '(.card)',
      body: [{ type: 'declaration', prop: 'color', value: 'red' }],
    });
  });

  it('should parse @scope with to() target', () => {
    const node = parseCssAtRule(
      createCssTokenCursor(
        tokenizeCss(`
          @scope (.card) to (.title) {
            padding: 8px;
          }
        `),
      ),
    );

    expect(node.params).toBe('(.card)to(.title)');
  });

  it('should parse @scope without params but with block', () => {
    const node = parseCssAtRule(
      createCssTokenCursor(
        tokenizeCss(`
          @scope {
            color: red;
          }
        `),
      ),
    );

    expect(node.params).toBeUndefined();
  });

  it('should parse named @container with condition', () => {
    const node = parseCssAtRule(
      createCssTokenCursor(
        tokenizeCss(`
          @container sidebar (min-width: 600px) {
            padding: 8px;
          }
        `),
      ),
    );

    expect(node).toStrictEqual({
      type: 'atRule',
      name: 'container',
      params: 'sidebar(min-width: 600px)',
      body: [{ type: 'declaration', prop: 'padding', value: '8px' }],
    });
  });

  it('should parse @container without container name', () => {
    const node = parseCssAtRule(
      createCssTokenCursor(
        tokenizeCss(`
          @container (min-width: 500px) {
            .card {
              display: grid;
            }
          }
        `),
      ),
    );

    expect(node).toStrictEqual({
      type: 'atRule',
      name: 'container',
      params: '(min-width: 500px)',
      body: [
        {
          type: 'rule',
          selector: '.card',
          body: [{ type: 'declaration', prop: 'display', value: 'grid' }],
        },
      ],
    });
  });

  it('should parse @container with logical and condition', () => {
    const node = parseCssAtRule(
      createCssTokenCursor(
        tokenizeCss(`
          @container (width > 400px) and style(--responsive: true) {
            h2 { font-size: 1.5em; }
          }
        `),
      ),
    );

    expect(node.params).toBe('(width > 400px)and style(--responsive: true)');
  });

  it('should parse @container with condition list', () => {
    const node = parseCssAtRule(
      createCssTokenCursor(
        tokenizeCss(`
          @container card (width > 400px), style(--responsive: true), scroll-state(stuck: top) {
            h2 { font-size: 1.5em; }
          }
        `),
      ),
    );

    expect(node.params).toBe(
      'card(width > 400px), style(--responsive: true), scroll-state(stuck: top)',
    );
  });
});
