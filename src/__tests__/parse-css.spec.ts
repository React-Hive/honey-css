import { parseCss } from '../parse-css';

describe('[parseCss]: parse full CSS input into AST', () => {
  it('should return empty stylesheet for empty input', () => {
    const ast = parseCss('');

    expect(ast).toStrictEqual({
      type: 'stylesheet',
      body: [],
    });
  });

  it('should parse a single top-level declaration', () => {
    const ast = parseCss(`
      color: red;
    `);

    expect(ast).toStrictEqual({
      type: 'stylesheet',
      body: [
        {
          type: 'declaration',
          prop: 'color',
          value: 'red',
        },
      ],
    });
  });

  it('should parse multiple top-level declarations', () => {
    const ast = parseCss(`
      color: red;
      padding: 12px;
    `);

    expect(ast).toStrictEqual({
      type: 'stylesheet',
      body: [
        {
          type: 'declaration',
          prop: 'color',
          value: 'red',
        },
        {
          type: 'declaration',
          prop: 'padding',
          value: '12px',
        },
      ],
    });
  });

  it('should parse a top-level rule block', () => {
    const ast = parseCss(`
      .child {
        padding: 8px;
      }
    `);

    expect(ast).toStrictEqual({
      type: 'stylesheet',
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

  it('should parse a top-level at-rule with params', () => {
    const ast = parseCss(`
      @honey-media (sm:down) {
        color: red;
      }
    `);

    expect(ast).toStrictEqual({
      type: 'stylesheet',
      body: [
        {
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
        },
      ],
    });
  });

  it('should parse a top-level at-rule without params', () => {
    const ast = parseCss(`
      @honey-stack {
        display: flex;
      }
    `);

    expect(ast).toStrictEqual({
      type: 'stylesheet',
      body: [
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

  it('should support nested rules inside at-rule', () => {
    const ast = parseCss(`
      @honey-media (sm:down) {
        .child {
          padding: 8px;
        }
      }
    `);

    expect(ast.body[0]).toStrictEqual({
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
    const ast = parseCss(`
      @honey-media (sm:down) {
        @honey-media (xs:down) {
          opacity: 0.5;
        }
      }
    `);

    expect(ast.body[0]).toStrictEqual({
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

  it('should ignore stray semicolons safely', () => {
    const ast = parseCss(`
      ;
      color: red;
      ;
    `);

    expect(ast).toStrictEqual({
      type: 'stylesheet',
      body: [
        {
          type: 'declaration',
          prop: 'color',
          value: 'red',
        },
      ],
    });
  });

  it('should parse mixed top-level nodes in correct order', () => {
    const ast = parseCss(`
      color: black;

      .child {
        padding: 8px;
      }

      @honey-media (sm:down) {
        opacity: 0.5;
      }
    `);

    expect(ast).toStrictEqual({
      type: 'stylesheet',
      body: [
        {
          type: 'declaration',
          prop: 'color',
          value: 'black',
        },
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
          name: 'honey-media',
          params: '(sm:down)',
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
});
