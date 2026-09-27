import {fireEvent, render} from '@testing-library/react';
import {expect, test, vi} from 'vitest';
import {ListGroupView} from '../list-group/list-group';
import {ListItemView} from '../list-item/list-item';
import {ListView} from './list';

test('a list groups its rows under a headed group', () => {
  const {getAllByRole, container} = render(
    <ListView>
      <ListGroupView label="In Progress" count="2" leading={<i>glyph</i>}>
        <ListItemView>First</ListItemView>
        <ListItemView>Second</ListItemView>
      </ListGroupView>
    </ListView>,
  );
  expect(container.querySelector('.lc-list-group-label')?.textContent).toBe('In Progress');
  expect(container.querySelector('.lc-list-group-count')?.textContent).toBe('2');
  expect(container.querySelector('.lc-list-group-leading i')).not.toBeNull();
  // The group itself is an item of the outer list, its rows items of its own.
  expect(getAllByRole('listitem')).toHaveLength(3);
});

test('a row lays out its leading visuals, content and trailing meta', () => {
  const {container} = render(
    <ListView>
      <ListItemView leading={<b>P</b>} trailing={<em>Sep 19</em>}>
        Say on the canvas when an utterance fails
      </ListItemView>
    </ListView>,
  );
  const row = container.querySelector('.lc-row')!;
  expect(row.querySelector('.lc-list-item-leading b')).not.toBeNull();
  expect(row.querySelector('.lc-list-item-content')?.textContent).toContain('utterance');
  expect(row.querySelector('.lc-list-item-trailing em')?.textContent).toBe('Sep 19');
  expect(row.getAttribute('role')).toBeNull();
});

test('a row with an action is one button, by click or by key', () => {
  const onAction = vi.fn();
  const {getByRole} = render(
    <ListView>
      <ListItemView onAction={onAction}>Open me</ListItemView>
    </ListView>,
  );
  const row = getByRole('button', {name: 'Open me'});
  fireEvent.click(row);
  fireEvent.keyDown(row, {key: 'Enter'});
  fireEvent.keyDown(row, {key: ' '});
  fireEvent.keyDown(row, {key: 'Tab'});
  expect(onAction).toHaveBeenCalledTimes(3);
});
