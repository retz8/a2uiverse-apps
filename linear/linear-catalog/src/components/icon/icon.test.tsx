import {render} from '@testing-library/react';
import {expect, test} from 'vitest';
import {ICON_NAMES, IconApi} from './icon.schema';
import {IconView} from './icon';

test('every icon name draws a path', () => {
  for (const name of ICON_NAMES) {
    const {container, unmount} = render(<IconView name={name} />);
    expect(container.querySelector('path')?.getAttribute('d')).toBeTruthy();
    unmount();
  }
});

test('an icon is decorative unless labelled', () => {
  const {container, getByRole} = render(
    <>
      <IconView name="branch" />
      <IconView name="pull-request" label="Pull request" />
    </>,
  );
  expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  expect(getByRole('img', {name: 'Pull request'})).toBeTruthy();
});

test('an icon name is fixed configuration, never bound', () => {
  expect(IconApi.schema.safeParse({name: 'branch'}).success).toBe(true);
  expect(IconApi.schema.safeParse({name: {path: '/icon'}}).success).toBe(false);
});
