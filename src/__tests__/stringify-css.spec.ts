import type { HoneyCssAstStylesheetNode } from '../types';
import { stringifyCss } from '../stringify-css';

describe('[stringifyCss]: stringify AST back into CSS', () => {
  it('should return empty string for empty stylesheet', () => {
    const ast: HoneyCssAstStylesheetNode = {
      type: 'stylesheet',
      body: [],
    };

    expect(stringifyCss(ast)).toBe('');
  });

  it('should stringify a single declaration', () => {
    const ast: HoneyCssAstStylesheetNode = {
      type: 'stylesheet',
      body: [
        {
          type: 'declaration',
          prop: 'color',
          value: 'red',
        },
      ],
    };

    expect(stringifyCss(ast)).toBe('color:red;');
  });

  it('should stringify multiple top-level nodes in order', () => {
    const ast: HoneyCssAstStylesheetNode = {
      type: 'stylesheet',
      body: [
        {
          type: 'declaration',
          prop: 'color',
          value: 'red',
        },
        {
          type: 'rule',
          selector: '.btn',
          body: [
            {
              type: 'declaration',
              prop: 'padding',
              value: '8px',
            },
          ],
        },
      ],
    };

    expect(stringifyCss(ast)).toBe('color:red;.btn{padding:8px;}');
  });

  it('should ignore unknown node types safely', () => {
    const ast = {
      type: 'stylesheet',
      body: [
        {
          type: 'weirdNode',
        },
      ],
    } as unknown as HoneyCssAstStylesheetNode;

    expect(stringifyCss(ast)).toBe('');
  });

  it('should stringify a simple rule', () => {
    const ast: HoneyCssAstStylesheetNode = {
      type: 'stylesheet',
      body: [
        {
          type: 'rule',
          selector: '.btn',
          body: [
            {
              type: 'declaration',
              prop: 'padding',
              value: '12px',
            },
          ],
        },
      ],
    };

    expect(stringifyCss(ast)).toBe('.btn{padding:12px;}');
  });

  it('should stringify multiple declarations inside a rule', () => {
    const ast: HoneyCssAstStylesheetNode = {
      type: 'stylesheet',
      body: [
        {
          type: 'rule',
          selector: '.box',
          body: [
            {
              type: 'declaration',
              prop: 'width',
              value: '100%',
            },
            {
              type: 'declaration',
              prop: 'height',
              value: '50px',
            },
          ],
        },
      ],
    };

    expect(stringifyCss(ast)).toBe('.box{width:100%;height:50px;}');
  });

  it('should stringify nested rules', () => {
    const ast: HoneyCssAstStylesheetNode = {
      type: 'stylesheet',
      body: [
        {
          type: 'rule',
          selector: '.parent',
          body: [
            {
              type: 'rule',
              selector: '.child',
              body: [
                {
                  type: 'declaration',
                  prop: 'opacity',
                  value: '0.5',
                },
              ],
            },
          ],
        },
      ],
    };

    expect(stringifyCss(ast)).toBe('.parent{.child{opacity:0.5;}}');
  });

  it('should stringify block at-rule without params', () => {
    const ast: HoneyCssAstStylesheetNode = {
      type: 'stylesheet',
      body: [
        {
          type: 'atRule',
          name: 'supports',
          body: [
            {
              type: 'declaration',
              prop: 'display',
              value: 'block',
            },
          ],
        },
      ],
    };

    expect(stringifyCss(ast)).toBe('@supports{display:block;}');
  });

  it('should stringify block at-rule with params', () => {
    const ast: HoneyCssAstStylesheetNode = {
      type: 'stylesheet',
      body: [
        {
          type: 'atRule',
          name: 'media',
          params: '(max-width:768px)',
          body: [
            {
              type: 'rule',
              selector: '.btn',
              body: [
                {
                  type: 'declaration',
                  prop: 'font-size',
                  value: '14px',
                },
              ],
            },
          ],
        },
      ],
    };

    expect(stringifyCss(ast)).toBe('@media (max-width:768px){.btn{font-size:14px;}}');
  });

  it('should stringify nested at-rules', () => {
    const ast: HoneyCssAstStylesheetNode = {
      type: 'stylesheet',
      body: [
        {
          type: 'atRule',
          name: 'media',
          params: '(max-width:768px)',
          body: [
            {
              type: 'atRule',
              name: 'supports',
              params: '(display:grid)',
              body: [
                {
                  type: 'declaration',
                  prop: 'gap',
                  value: '12px',
                },
              ],
            },
          ],
        },
      ],
    };

    expect(stringifyCss(ast)).toBe('@media (max-width:768px){@supports (display:grid){gap:12px;}}');
  });

  it('should stringify directive at-rule with params', () => {
    const ast: HoneyCssAstStylesheetNode = {
      type: 'stylesheet',
      body: [
        {
          type: 'atRule',
          name: 'charset',
          params: '"UTF-8"',
          body: null,
        },
      ],
    };

    expect(stringifyCss(ast)).toBe('@charset "UTF-8";');
  });

  it('should stringify directive at-rule without params', () => {
    const ast: HoneyCssAstStylesheetNode = {
      type: 'stylesheet',
      body: [
        {
          type: 'atRule',
          name: 'custom',
          body: null,
        },
      ],
    };

    expect(stringifyCss(ast)).toBe('@custom;');
  });

  it('should stringify @import correctly', () => {
    const ast: HoneyCssAstStylesheetNode = {
      type: 'stylesheet',
      body: [
        {
          type: 'atRule',
          name: 'import',
          params: 'url("file.css")',
          body: null,
        },
      ],
    };

    expect(stringifyCss(ast)).toBe('@import url("file.css");');
  });

  it('should remove empty declaration', () => {
    const ast: HoneyCssAstStylesheetNode = {
      type: 'stylesheet',
      body: [
        {
          type: 'declaration',
          prop: 'color',
          value: '   ',
        },
      ],
    };

    expect(stringifyCss(ast)).toBe('');
  });

  it('should remove rule with empty body', () => {
    const ast: HoneyCssAstStylesheetNode = {
      type: 'stylesheet',
      body: [
        {
          type: 'rule',
          selector: '.empty',
          body: [],
        },
      ],
    };

    expect(stringifyCss(ast)).toBe('');
  });

  it('should remove block at-rule with empty body', () => {
    const ast: HoneyCssAstStylesheetNode = {
      type: 'stylesheet',
      body: [
        {
          type: 'atRule',
          name: 'media',
          params: '(min-width: 100px)',
          body: [],
        },
      ],
    };

    expect(stringifyCss(ast)).toBe('');
  });

  it('should remove nested empty rules recursively', () => {
    const ast: HoneyCssAstStylesheetNode = {
      type: 'stylesheet',
      body: [
        {
          type: 'rule',
          selector: '.parent',
          body: [
            {
              type: 'rule',
              selector: '.child',
              body: [],
            },
          ],
        },
      ],
    };

    expect(stringifyCss(ast)).toBe('');
  });

  it('should keep valid nodes while removing empty ones', () => {
    const ast: HoneyCssAstStylesheetNode = {
      type: 'stylesheet',
      body: [
        {
          type: 'rule',
          selector: '.empty',
          body: [],
        },
        {
          type: 'rule',
          selector: '.valid',
          body: [
            {
              type: 'declaration',
              prop: 'margin',
              value: '0',
            },
          ],
        },
      ],
    };

    expect(stringifyCss(ast)).toBe('.valid{margin:0;}');
  });
});
