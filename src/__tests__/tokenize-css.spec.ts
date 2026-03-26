import { tokenizeCss } from '../tokenize-css';

describe('[tokenizeCss]: tokenize CSS input', () => {
  it('should return empty array for empty input', () => {
    expect(tokenizeCss('')).toStrictEqual([]);
  });

  it('should ignore whitespace-only input', () => {
    expect(tokenizeCss('   \n\t  ')).toStrictEqual([]);
  });

  it('should tokenize basic punctuation correctly', () => {
    const tokens = tokenizeCss('{ }: ; @');

    expect(tokens).toStrictEqual([
      { type: 'braceOpen' },
      { type: 'braceClose' },
      { type: 'colon' },
      { type: 'semicolon' },
      { type: 'at' },
    ]);
  });

  it('should tokenize plain text chunks correctly', () => {
    const tokens = tokenizeCss('color red padding');

    expect(tokens).toStrictEqual([
      {
        type: 'text',
        value: 'color red padding',
      },
    ]);
  });

  it('should split tokens at boundaries correctly', () => {
    const tokens = tokenizeCss('color: red;');

    expect(tokens).toStrictEqual([
      { type: 'text', value: 'color' },
      { type: 'colon' },
      { type: 'text', value: 'red' },
      { type: 'semicolon' },
    ]);
  });

  it('should tokenize multiple selectors separated by commas correctly', () => {
    const tokens = tokenizeCss(`.a, .b { color: red; }`);

    expect(tokens).toStrictEqual([
      { type: 'text', value: '.a, .b' },
      { type: 'braceOpen' },

      { type: 'text', value: 'color' },
      { type: 'colon' },
      { type: 'text', value: 'red' },
      { type: 'semicolon' },

      { type: 'braceClose' },
    ]);
  });

  it('should support nested parentheses inside params group', () => {
    const tokens = tokenizeCss('(min-width: calc(100% - 1px))');

    expect(tokens).toStrictEqual([
      {
        type: 'params',
        value: '(min-width: calc(100% - 1px))',
      },
    ]);
  });

  it('should tokenize quoted strings correctly', () => {
    const tokens = tokenizeCss(`content: "hello world";`);

    expect(tokens).toStrictEqual([
      { type: 'text', value: 'content' },
      { type: 'colon' },
      { type: 'string', value: 'hello world' },
      { type: 'semicolon' },
    ]);
  });

  it('should tokenize single-quoted strings correctly', () => {
    const tokens = tokenizeCss(`font-family: 'Inter';`);

    expect(tokens).toStrictEqual([
      { type: 'text', value: 'font-family' },
      { type: 'colon' },
      { type: 'string', value: 'Inter' },
      { type: 'semicolon' },
    ]);
  });

  it('should preserve escaped characters inside strings', () => {
    const tokens = tokenizeCss(`content: "a\\\"b";`);

    expect(tokens).toStrictEqual([
      { type: 'text', value: 'content' },
      { type: 'colon' },
      { type: 'string', value: 'a\\"b' },
      { type: 'semicolon' },
    ]);
  });

  it('should tokenize selector edge cases correctly', () => {
    const tokens = tokenizeCss(`
      &:hover {
        opacity: 0.5;
      }
    `);

    expect(tokens).toStrictEqual([
      { type: 'text', value: '&' },
      { type: 'colon' },
      { type: 'text', value: 'hover' },
      { type: 'braceOpen' },

      { type: 'text', value: 'opacity' },
      { type: 'colon' },
      { type: 'text', value: '0.5' },
      { type: 'semicolon' },

      { type: 'braceClose' },
    ]);
  });

  it('should treat attribute selectors as a single text token', () => {
    const tokens = tokenizeCss(`&[data-open]{opacity:1;}`);

    expect(tokens).toStrictEqual([
      { type: 'text', value: '&[data-open]' },
      { type: 'braceOpen' },

      { type: 'text', value: 'opacity' },
      { type: 'colon' },
      { type: 'text', value: '1' },
      { type: 'semicolon' },

      { type: 'braceClose' },
    ]);
  });

  it('should tolerate spaces inside attribute selector brackets (tokenizer trims text tokens)', () => {
    const tokens = tokenizeCss(`a[ href = "x" ]{color:red;}`);

    expect(tokens).toStrictEqual([
      { type: 'text', value: 'a[ href =' },
      { type: 'string', value: 'x' },
      { type: 'text', value: ']' },

      { type: 'braceOpen' },

      { type: 'text', value: 'color' },
      { type: 'colon' },
      { type: 'text', value: 'red' },
      { type: 'semicolon' },

      { type: 'braceClose' },
    ]);
  });

  it('should treat attribute operators correctly (~=, |=, ^=, $=, *=)', () => {
    const tokens = tokenizeCss(
      `a[rel~="tag"][lang|="en"][data-x^="a"][data-y$="b"][data-z*="c"]{opacity:1;}`,
    );

    expect(tokens).toStrictEqual([
      { type: 'text', value: 'a[rel~=' },
      { type: 'string', value: 'tag' },
      { type: 'text', value: '][lang|=' },
      { type: 'string', value: 'en' },
      { type: 'text', value: '][data-x^=' },
      { type: 'string', value: 'a' },
      { type: 'text', value: '][data-y$=' },
      { type: 'string', value: 'b' },
      { type: 'text', value: '][data-z*=' },
      { type: 'string', value: 'c' },
      { type: 'text', value: ']' },
      { type: 'braceOpen' },

      { type: 'text', value: 'opacity' },
      { type: 'colon' },
      { type: 'text', value: '1' },
      { type: 'semicolon' },

      { type: 'braceClose' },
    ]);
  });

  it('should treat attribute selector combined with pseudo selector correctly', () => {
    const tokens = tokenizeCss(`a[href="x"]:focus{outline:0;}`);

    expect(tokens).toStrictEqual([
      { type: 'text', value: 'a[href=' },
      { type: 'string', value: 'x' },
      { type: 'text', value: ']' },
      { type: 'colon' },
      { type: 'text', value: 'focus' },
      { type: 'braceOpen' },

      { type: 'text', value: 'outline' },
      { type: 'colon' },
      { type: 'text', value: '0' },
      { type: 'semicolon' },

      { type: 'braceClose' },
    ]);
  });

  it('should tokenize id selectors correctly', () => {
    const tokens = tokenizeCss(`#burger-btn{display:none;}`);

    expect(tokens).toStrictEqual([
      { type: 'text', value: '#burger-btn' },
      { type: 'braceOpen' },

      { type: 'text', value: 'display' },
      { type: 'colon' },
      { type: 'text', value: 'none' },
      { type: 'semicolon' },

      { type: 'braceClose' },
    ]);
  });

  it('should skip single-line // comments completely', () => {
    const tokens = tokenizeCss(`
      color: red;
  
      // this is a single-line comment
      padding: 12px;
    `);

    expect(tokens).toStrictEqual([
      { type: 'text', value: 'color' },
      { type: 'colon' },
      { type: 'text', value: 'red' },
      { type: 'semicolon' },

      { type: 'text', value: 'padding' },
      { type: 'colon' },
      { type: 'text', value: '12px' },
      { type: 'semicolon' },
    ]);
  });

  it('should skip inline // comments after declarations', () => {
    const tokens = tokenizeCss(`
      color: red; // inline comment
      margin: 8px; // another comment
    `);

    expect(tokens).toStrictEqual([
      { type: 'text', value: 'color' },
      { type: 'colon' },
      { type: 'text', value: 'red' },
      { type: 'semicolon' },

      { type: 'text', value: 'margin' },
      { type: 'colon' },
      { type: 'text', value: '8px' },
      { type: 'semicolon' },
    ]);
  });

  it('should skip multiline block comments completely', () => {
    const tokens = tokenizeCss(`
      color: red;
  
      /*
        this is a multiline comment
        with multiple lines
        and even symbols: { } : ;
      */
  
      padding: 12px;
  `);

    expect(tokens).toStrictEqual([
      { type: 'text', value: 'color' },
      { type: 'colon' },
      { type: 'text', value: 'red' },
      { type: 'semicolon' },

      { type: 'text', value: 'padding' },
      { type: 'colon' },
      { type: 'text', value: '12px' },
      { type: 'semicolon' },
    ]);
  });

  it('should tokenize pseudo functions like :not() correctly', () => {
    const tokens = tokenizeCss(`button:not(:disabled){opacity:1;}`);

    expect(tokens).toStrictEqual([
      { type: 'text', value: 'button' },
      { type: 'colon' },
      { type: 'text', value: 'not' },
      { type: 'params', value: '(:disabled)' },

      { type: 'braceOpen' },

      { type: 'text', value: 'opacity' },
      { type: 'colon' },
      { type: 'text', value: '1' },
      { type: 'semicolon' },

      { type: 'braceClose' },
    ]);
  });

  it('should tokenize pseudo elements like ::before correctly', () => {
    const tokens = tokenizeCss(`.btn::before{content:"x";}`);

    expect(tokens).toStrictEqual([
      { type: 'text', value: '.btn' },
      { type: 'colon' },
      { type: 'colon' },
      { type: 'text', value: 'before' },

      { type: 'braceOpen' },

      { type: 'text', value: 'content' },
      { type: 'colon' },
      { type: 'string', value: 'x' },
      { type: 'semicolon' },

      { type: 'braceClose' },
    ]);
  });

  it('should tokenize sibling selectors correctly', () => {
    const tokens = tokenizeCss(`& + &{margin-top:12px;}`);

    expect(tokens).toStrictEqual([
      { type: 'text', value: '& + &' },
      { type: 'braceOpen' },

      { type: 'text', value: 'margin-top' },
      { type: 'colon' },
      { type: 'text', value: '12px' },
      { type: 'semicolon' },

      { type: 'braceClose' },
    ]);
  });

  it('should tokenize child combinators correctly', () => {
    const tokens = tokenizeCss(`.parent > .child{width:100%;}`);

    expect(tokens).toStrictEqual([
      { type: 'text', value: '.parent > .child' },
      { type: 'braceOpen' },

      { type: 'text', value: 'width' },
      { type: 'colon' },
      { type: 'text', value: '100%' },
      { type: 'semicolon' },

      { type: 'braceClose' },
    ]);
  });

  it('should tokenize url() values correctly', () => {
    const tokens = tokenizeCss(`background:url("image.png");`);

    expect(tokens).toStrictEqual([
      { type: 'text', value: 'background' },
      { type: 'colon' },
      { type: 'text', value: 'url' },
      { type: 'params', value: '("image.png")' },
      { type: 'semicolon' },
    ]);
  });

  it('should tokenize complex media query params correctly', () => {
    const tokens = tokenizeCss(`@media (min-width: 600px) and (max-width: 900px){}`);

    expect(tokens).toStrictEqual([
      { type: 'at' },
      { type: 'text', value: 'media' },
      { type: 'params', value: '(min-width: 600px)' },
      { type: 'text', value: 'and' },
      { type: 'params', value: '(max-width: 900px)' },
      { type: 'braceOpen' },
      { type: 'braceClose' },
    ]);
  });

  it('should tokenize CSS custom properties (variables) correctly', () => {
    const tokens = tokenizeCss(`
      :root {
        --primary-color: red;
        --spacing-md: 12px;
      }
  
      .btn {
        color: var(--primary-color);
        padding: var(--spacing-md, 8px);
      }
  `);

    expect(tokens).toStrictEqual([
      // :root block
      { type: 'colon' },
      { type: 'text', value: 'root' },
      { type: 'braceOpen' },

      { type: 'text', value: '--primary-color' },
      { type: 'colon' },
      { type: 'text', value: 'red' },
      { type: 'semicolon' },

      { type: 'text', value: '--spacing-md' },
      { type: 'colon' },
      { type: 'text', value: '12px' },
      { type: 'semicolon' },

      { type: 'braceClose' },

      // .btn block
      { type: 'text', value: '.btn' },
      { type: 'braceOpen' },

      { type: 'text', value: 'color' },
      { type: 'colon' },
      { type: 'text', value: 'var' },
      { type: 'params', value: '(--primary-color)' },
      { type: 'semicolon' },

      { type: 'text', value: 'padding' },
      { type: 'colon' },
      { type: 'text', value: 'var' },
      { type: 'params', value: '(--spacing-md, 8px)' },
      { type: 'semicolon' },

      { type: 'braceClose' },
    ]);
  });

  it('should tokenize nested function params like url(var(--x)) correctly', () => {
    const tokens = tokenizeCss(`background:url(var(--img));`);

    expect(tokens).toStrictEqual([
      { type: 'text', value: 'background' },
      { type: 'colon' },

      { type: 'text', value: 'url' },
      { type: 'params', value: '(var(--img))' },

      { type: 'semicolon' },
    ]);
  });

  it('should tokenize !important correctly', () => {
    const tokens = tokenizeCss(`color:red!important;`);

    expect(tokens).toStrictEqual([
      { type: 'text', value: 'color' },
      { type: 'colon' },
      { type: 'text', value: 'red!important' },
      { type: 'semicolon' },
    ]);
  });

  it('should safely stop when comment is not closed', () => {
    const tokens = tokenizeCss(`
      color: red;
      /* unfinished comment...
  `);

    expect(tokens).toStrictEqual([
      { type: 'text', value: 'color' },
      { type: 'colon' },
      { type: 'text', value: 'red' },
      { type: 'semicolon' },
    ]);
  });

  it('should safely stop when string is not closed', () => {
    const tokens = tokenizeCss(`content: "oops;`);

    expect(tokens).toStrictEqual([
      { type: 'text', value: 'content' },
      { type: 'colon' },
      { type: 'string', value: 'oops;' },
    ]);
  });

  it('should tokenize @keyframes blocks correctly', () => {
    const tokens = tokenizeCss(`
      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `);

    expect(tokens).toStrictEqual([
      { type: 'at' },
      { type: 'text', value: 'keyframes spin' },
      { type: 'braceOpen' },

      { type: 'text', value: '0%' },
      { type: 'braceOpen' },

      { type: 'text', value: 'transform' },
      { type: 'colon' },
      { type: 'text', value: 'rotate' },
      { type: 'params', value: '(0deg)' },
      { type: 'semicolon' },

      { type: 'braceClose' },

      { type: 'text', value: '100%' },
      { type: 'braceOpen' },

      { type: 'text', value: 'transform' },
      { type: 'colon' },
      { type: 'text', value: 'rotate' },
      { type: 'params', value: '(360deg)' },
      { type: 'semicolon' },

      { type: 'braceClose' },

      { type: 'braceClose' },
    ]);
  });

  it('should tokenize @scope with to() target correctly', () => {
    const tokens = tokenizeCss(`
      @scope (.card) to (.title) {
        padding: 8px;
      }
    `);

    expect(tokens).toStrictEqual([
      { type: 'at' },
      { type: 'text', value: 'scope' },
      { type: 'params', value: '(.card)' },
      { type: 'text', value: 'to' },
      { type: 'params', value: '(.title)' },
      { type: 'braceOpen' },

      { type: 'text', value: 'padding' },
      { type: 'colon' },
      { type: 'text', value: '8px' },
      { type: 'semicolon' },

      { type: 'braceClose' },
    ]);
  });

  it('should tokenize a full @honey-media block correctly', () => {
    const tokens = tokenizeCss(`
      @honey-media (sm:down) {
        color: red;
      }
    `);

    expect(tokens).toStrictEqual([
      { type: 'at' },
      { type: 'text', value: 'honey-media' },
      { type: 'params', value: '(sm:down)' },
      { type: 'braceOpen' },

      { type: 'text', value: 'color' },
      { type: 'colon' },
      { type: 'text', value: 'red' },
      { type: 'semicolon' },

      { type: 'braceClose' },
    ]);
  });

  it('should tokenize params groups correctly', () => {
    const tokens = tokenizeCss('@honey-media (sm:down)');

    expect(tokens).toStrictEqual([
      { type: 'at' },
      { type: 'text', value: 'honey-media' },
      { type: 'params', value: '(sm:down)' },
    ]);
  });
});
