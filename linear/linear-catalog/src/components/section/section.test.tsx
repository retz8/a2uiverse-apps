import {render} from '@testing-library/react';
import {expect, test} from 'vitest';
import {SectionView} from './section';

test('a section is named by its title and shows its count', () => {
  const {getByRole, container} = render(
    <SectionView title="Links" count="2">
      rows
    </SectionView>,
  );
  expect(getByRole('region', {name: 'Links'})).toBeTruthy();
  expect(container.querySelector('.lc-count')?.textContent).toBe('2');
  expect(container.querySelector('.lc-section-body')?.textContent).toBe('rows');
});

test('a section with no count shows no badge', () => {
  const {container} = render(<SectionView title="Activity">rows</SectionView>);
  expect(container.querySelector('.lc-count')).toBeNull();
});
