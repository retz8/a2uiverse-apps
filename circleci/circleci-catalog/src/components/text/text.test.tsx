import {screen} from '@testing-library/react';
import {expect, test} from 'vitest';
import {renderTree} from '../../testing/render';
import {TextApi} from './text.schema';

test('draws its text with its style on data attributes', () => {
  renderTree(
    [
      {
        id: 'root',
        component: 'Text',
        text: {path: '/sha'},
        tone: 'muted',
        font: 'mono',
        size: 'small',
      },
    ],
    {data: {sha: '9c41e07'}},
  );
  const text = screen.getByText('9c41e07');
  expect(text).toHaveClass('circleci-text');
  expect(text).toHaveAttribute('data-tone', 'muted');
  expect(text).toHaveAttribute('data-font', 'mono');
  expect(text).toHaveAttribute('data-size', 'small');
  expect(text).toHaveAttribute('data-weight', 'normal');
});

test('truncated text keeps its whole value as a title', () => {
  renderTree([{id: 'root', component: 'Text', text: 'A long commit subject', truncate: true}]);
  expect(screen.getByText('A long commit subject')).toHaveAttribute(
    'title',
    'A long commit subject',
  );
});

test('an enum prop cannot be bound', () => {
  expect(TextApi.schema.safeParse({text: 'x', tone: {path: '/tone'}}).success).toBe(false);
});
