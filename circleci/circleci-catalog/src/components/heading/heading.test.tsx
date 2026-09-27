import {screen} from '@testing-library/react';
import {expect, test} from 'vitest';
import {renderTree} from '../../testing/render';

test('each size is its own heading level', () => {
  renderTree([
    {id: 'root', component: 'Stack', children: ['l', 'm', 's']},
    {id: 'l', component: 'Heading', text: 'Large', size: 'large'},
    {id: 'm', component: 'Heading', text: 'Medium'},
    {id: 's', component: 'Heading', text: 'Small', size: 'small'},
  ]);
  expect(screen.getByRole('heading', {level: 2, name: 'Large'})).toBeInTheDocument();
  expect(screen.getByRole('heading', {level: 3, name: 'Medium'})).toBeInTheDocument();
  expect(screen.getByRole('heading', {level: 4, name: 'Small'})).toBeInTheDocument();
});

test('binds its text', () => {
  renderTree([{id: 'root', component: 'Heading', text: {path: '/job/name'}}], {
    data: {job: {name: 'unit-tests'}},
  });
  expect(screen.getByRole('heading', {name: 'unit-tests'})).toBeInTheDocument();
});
