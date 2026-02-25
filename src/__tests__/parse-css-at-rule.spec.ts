import { parseCssAtRule } from '../parse-css-at-rule';
import { createCssTokenCursor } from '../create-css-token-cursor';
import { tokenizeCss } from '../tokenize-css';

describe('[parseCssAtRule]: parse @-rules', () => {
  it('should parse directive at-rule without params', () => {
    const tokens = tokenizeCss(`
      @charset;
    `);

    const node = parseCssAtRule(createCssTokenCursor(tokens));

    expect(node).toStrictEqual({
      type: 'atRule',
      name: 'charset',
      params: undefined,
      body: null,
    });
  });

  it('should parse at-rule with empty block body', () => {
    const tokens = tokenizeCss(`
      @media (max-width: 100px) {}
    `);

    const node = parseCssAtRule(createCssTokenCursor(tokens));

    expect(node).toStrictEqual({
      type: 'atRule',
      name: 'media',
      params: '(max-width: 100px)',
      body: [],
    });
  });

  it('should parse at-rule with params and declarations', () => {
    const tokens = tokenizeCss(`
      @honey-media (sm:down) {
        color: red;
      }
    `);

    const node = parseCssAtRule(createCssTokenCursor(tokens));

    expect(node).toStrictEqual({
      type: 'atRule',
      name: 'honey-media',
      params: '(sm:down)',
      body: [
        {
          type: 'declaration',
          prop: 'color',
          value: 'red',
        },
      ],
    });
  });

  it('should parse at-rule without params', () => {
    const tokens = tokenizeCss(`
      @honey-stack {
        display: flex;
      }
    `);

    const node = parseCssAtRule(createCssTokenCursor(tokens));

    expect(node).toStrictEqual({
      type: 'atRule',
      name: 'honey-stack',
      params: undefined,
      body: [
        {
          type: 'declaration',
          prop: 'display',
          value: 'flex',
        },
      ],
    });
  });

  it('should support nested rules inside at-rule', () => {
    const tokens = tokenizeCss(`
      @honey-media (sm:down) {
        .child {
          padding: 8px;
        }
      }
    `);

    const node = parseCssAtRule(createCssTokenCursor(tokens));

    expect(node).toStrictEqual({
      type: 'atRule',
      name: 'honey-media',
      params: '(sm:down)',
      body: [
        {
          type: 'rule',
          selector: '.child',
          body: [
            {
              type: 'declaration',
              prop: 'padding',
              value: '8px',
            },
          ],
        },
      ],
    });
  });

  it('should support nested at-rules inside at-rule', () => {
    const tokens = tokenizeCss(`
      @honey-media (sm:down) {
        @honey-media (xs:down) {
          opacity: 0.5;
        }
      }
    `);

    const node = parseCssAtRule(createCssTokenCursor(tokens));

    expect(node).toStrictEqual({
      type: 'atRule',
      name: 'honey-media',
      params: '(sm:down)',
      body: [
        {
          type: 'atRule',
          name: 'honey-media',
          params: '(xs:down)',
          body: [
            {
              type: 'declaration',
              prop: 'opacity',
              value: '0.5',
            },
          ],
        },
      ],
    });
  });

  it('should support mixed sibling nodes inside at-rule body', () => {
    const tokens = tokenizeCss(`
      @honey-media (sm:down) {
        color: red;
        
        .child {
          padding: 8px;
        }
        
        @honey-stack {
          display: flex;
        }
      }
    `);

    const node = parseCssAtRule(createCssTokenCursor(tokens));

    expect(node).toStrictEqual({
      type: 'atRule',
      name: 'honey-media',
      params: '(sm:down)',
      body: [
        { type: 'declaration', prop: 'color', value: 'red' },
        {
          type: 'rule',
          selector: '.child',
          body: [
            {
              type: 'declaration',
              prop: 'padding',
              value: '8px',
            },
          ],
        },
        {
          type: 'atRule',
          name: 'honey-stack',
          params: undefined,
          body: [
            {
              type: 'declaration',
              prop: 'display',
              value: 'flex',
            },
          ],
        },
      ],
    });
  });

  it('should parse @keyframes with animation name and blocks', () => {
    const tokens = tokenizeCss(`
      @keyframes spin {
        0% {
          opacity: 0;
        }
      }
    `);

    const node = parseCssAtRule(createCssTokenCursor(tokens));

    expect(node).toStrictEqual({
      type: 'atRule',
      name: 'keyframes',
      params: 'spin',
      body: [
        {
          type: 'rule',
          selector: '0%',
          body: [
            {
              type: 'declaration',
              prop: 'opacity',
              value: '0',
            },
          ],
        },
      ],
    });
  });

  it('should handle @keyframes without animation name', () => {
    const tokens = tokenizeCss(`
      @keyframes {
        0% {
          opacity: 0;
        }
      }
    `);

    const node = parseCssAtRule(createCssTokenCursor(tokens));

    expect(node).toStrictEqual({
      type: 'atRule',
      name: 'keyframes',
      params: undefined,
      body: [
        {
          type: 'rule',
          selector: '0%',
          body: [
            {
              type: 'declaration',
              prop: 'opacity',
              value: '0',
            },
          ],
        },
      ],
    });
  });

  it('should parse @layer block form', () => {
    const tokens = tokenizeCss(`
      @layer utilities {
        color: red;
      }
    `);

    const node = parseCssAtRule(createCssTokenCursor(tokens));

    expect(node).toStrictEqual({
      type: 'atRule',
      name: 'layer',
      params: 'utilities',
      body: [
        {
          type: 'declaration',
          prop: 'color',
          value: 'red',
        },
      ],
    });
  });

  it('should parse @layer directive form', () => {
    const tokens = tokenizeCss(`
      @layer utilities;
    `);

    const node = parseCssAtRule(createCssTokenCursor(tokens));

    expect(node).toStrictEqual({
      type: 'atRule',
      name: 'layer',
      params: 'utilities',
      body: null,
    });
  });

  it('should trim excessive whitespace in header correctly', () => {
    const tokens = tokenizeCss(`
      @layer     utilities     ;
    `);

    const node = parseCssAtRule(createCssTokenCursor(tokens));

    expect(node).toStrictEqual({
      type: 'atRule',
      name: 'layer',
      params: 'utilities',
      body: null,
    });
  });

  it('should parse @layer with comma-separated params', () => {
    const tokens = tokenizeCss(`
      @layer base, components;
    `);

    const node = parseCssAtRule(createCssTokenCursor(tokens));

    expect(node).toStrictEqual({
      type: 'atRule',
      name: 'layer',
      params: 'base, components',
      body: null,
    });
  });

  it('should parse directive at-rule with params token (@import)', () => {
    const tokens = tokenizeCss(`
      @import url("file.css");
    `);

    const node = parseCssAtRule(createCssTokenCursor(tokens));

    expect(node).toStrictEqual({
      type: 'atRule',
      name: 'import',
      params: 'url("file.css")',
      body: null,
    });
  });

  it('should parse space-delimited at-rule header correctly', () => {
    const tokens = tokenizeCss(`
      @counter-style custom {
        system: cyclic;
      }
    `);

    const node = parseCssAtRule(createCssTokenCursor(tokens));

    expect(node).toStrictEqual({
      type: 'atRule',
      name: 'counter-style',
      params: 'custom',
      body: [
        {
          type: 'declaration',
          prop: 'system',
          value: 'cyclic',
        },
      ],
    });
  });
});
