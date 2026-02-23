import { resolveCssSelector } from '../resolve-css-selector';

describe('[resolveCssSelector]: resolve nested selectors', () => {
  it('should scope a simple descendant selector', () => {
    expect(resolveCssSelector('.child', '.scope')).toBe('.scope .child');
  });

  it('should replace "&" with the parent selector', () => {
    expect(resolveCssSelector('&:hover', '.btn')).toBe('.btn:hover');
  });

  it('should support multiple "&" occurrences', () => {
    expect(resolveCssSelector('& + &', '.item')).toBe('.item + .item');
  });

  it('should resolve leading combinators correctly', () => {
    expect(resolveCssSelector('> .content', '.layout')).toBe('.layout > .content');
    expect(resolveCssSelector('+ .item', '.card')).toBe('.card + .item');
    expect(resolveCssSelector('~ .item', '.card')).toBe('.card ~ .item');
  });

  it('should support complex combinator chains', () => {
    expect(resolveCssSelector('> .a + .b ~ .c', '.scope')).toBe('.scope > .a + .b ~ .c');
  });

  it('should support combinators with "&" reference', () => {
    expect(resolveCssSelector('& > .a + .b', '.scope')).toBe('.scope > .a + .b');
  });

  it('should support comma-separated child selectors', () => {
    expect(resolveCssSelector('.a, .b', '.scope')).toBe('.scope .a, .scope .b');
  });

  it('should support comma-separated selectors with "&"', () => {
    expect(resolveCssSelector('&:hover, &.active', '.btn')).toBe('.btn:hover, .btn.active');
  });

  it('should support multiple parent selectors', () => {
    expect(resolveCssSelector('.child', '.a, .b')).toBe('.a .child, .b .child');
  });

  it('should perform full cartesian expansion for parent and child lists', () => {
    expect(resolveCssSelector('.x, .y', '.a, .b')).toBe('.a .x, .a .y, .b .x, .b .y');
  });

  it('should support mixed parent + child lists with "&"', () => {
    expect(resolveCssSelector('&:hover, .icon', '.btn, .card')).toBe(
      '.btn:hover, .btn .icon, .card:hover, .card .icon',
    );
  });

  it('should trim extra whitespace correctly', () => {
    expect(resolveCssSelector('   .child   ', '.scope')).toBe('.scope .child');
    expect(resolveCssSelector(' .a ,   .b  ', '.scope')).toBe('.scope .a, .scope .b');
  });

  it('should preserve pseudo-elements and pseudo-functions', () => {
    expect(resolveCssSelector('&::before', '.btn')).toBe('.btn::before');
    expect(resolveCssSelector('button:not(:disabled)', '.scope')).toBe(
      '.scope button:not(:disabled)',
    );
  });

  it('should not split selectors inside :is() or :not() comma lists', () => {
    expect(resolveCssSelector(':is(.a, .b)', '.scope')).toBe('.scope :is(.a, .b)');
    expect(resolveCssSelector('button:not(.a, .b)', '.scope')).toBe('.scope button:not(.a, .b)');
  });

  it('should support deeply nested pseudo functions', () => {
    expect(resolveCssSelector(':is(:not(.a, .b), .c)', '.scope')).toBe(
      '.scope :is(:not(.a, .b), .c)',
    );
  });

  it('should preserve attribute selectors', () => {
    expect(resolveCssSelector('[data-x="1"]', '.scope')).toBe('.scope [data-x="1"]');
    expect(resolveCssSelector('[data-x="a,b"]', '.scope')).toBe('.scope [data-x="a,b"]');
  });

  it('should support parent selector containing combinators', () => {
    expect(resolveCssSelector('.child', '.parent > .layout')).toBe('.parent > .layout .child');
  });

  it('should handle empty inputs safely', () => {
    expect(resolveCssSelector('.child', '')).toBe('.child');
    expect(resolveCssSelector('', '.scope')).toBe('');
  });

  it('should not split escaped commas', () => {
    expect(resolveCssSelector('.a\\,b', '.scope')).toBe('.scope .a\\,b');
  });

  it('should handle escaped quotes inside attribute selectors', () => {
    expect(resolveCssSelector('[data-x="a\\"b"]', '.scope')).toBe('.scope [data-x="a\\"b"]');
  });

  it('should not split commas inside nested attribute brackets', () => {
    expect(resolveCssSelector('[data-x="[a,b]"]', '.scope')).toBe('.scope [data-x="[a,b]"]');
  });
});
