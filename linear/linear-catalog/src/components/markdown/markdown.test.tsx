import {render} from '@testing-library/react';
import {expect, test} from 'vitest';
import {MarkdownView} from './markdown';

test('Markdown renders its formatting and drops links to their text', () => {
  const {container} = render(
    <MarkdownView text={'**synced** to a [GitHub issue](https://github.com/x/y/issues/3)'} />,
  );
  expect(container.querySelector('.lc-markdown strong')?.textContent).toBe('synced');
  expect(container.querySelector('a')).toBeNull();
  expect(container.textContent).toContain('GitHub issue');
});
