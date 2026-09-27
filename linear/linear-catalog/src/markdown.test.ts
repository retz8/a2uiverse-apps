import {expect, test} from 'vitest';
import {renderMarkdown} from './markdown';

test('simple formatting renders', () => {
  const html = renderMarkdown('**bold**, _em_ and `code`\n\n- one\n- two');
  expect(html).toContain('<strong>bold</strong>');
  expect(html).toContain('<em>em</em>');
  expect(html).toContain('<code>code</code>');
  expect(html).toContain('<li>one</li>');
});

test('a link renders as its text, with no anchor', () => {
  const html = renderMarkdown(
    'synced to a corresponding [GitHub issue](https://github.com/retz8/a2uiverse/issues/3).',
  );
  expect(html).toContain('synced to a corresponding GitHub issue.');
  expect(html).not.toContain('<a');
  expect(html).not.toContain('https://');
});

test('an autolink keeps its address as text, never as an anchor', () => {
  const html = renderMarkdown('see <https://linear.app>');
  expect(html).toContain('https://linear.app');
  expect(html).not.toContain('<a');
});

test('an image renders as its alt text', () => {
  const html = renderMarkdown('![connect-your-tools.png](https://uploads.linear.app/x/y)');
  expect(html).toContain('connect-your-tools.png');
  expect(html).not.toContain('<img');
  expect(html).not.toContain('uploads.linear.app');
});

test('raw HTML is escaped, never rendered', () => {
  const html = renderMarkdown('<script>alert(1)</script> <img src=x onerror=alert(1)>');
  expect(html).not.toContain('<script');
  expect(html).not.toContain('<img');
  expect(html).toContain('&lt;script&gt;');
});

test('alt text is escaped too', () => {
  const html = renderMarkdown('![<b>x</b>](https://a/b)');
  expect(html).not.toContain('<b>');
});
