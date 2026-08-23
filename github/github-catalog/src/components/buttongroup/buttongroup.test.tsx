import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ButtonGroupView} from './buttongroup';

afterEach(cleanup);

describe('ButtonGroupView', () => {
  it('renders its children', () => {
    render(
      <ButtonGroupView>
        <button type="button">Save</button>
        <button type="button">Cancel</button>
      </ButtonGroupView>,
    );
    expect(screen.getByRole('button', {name: 'Save'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Cancel'})).toBeInTheDocument();
  });

  it('forwards role="toolbar" as the DOM role attribute', () => {
    render(
      <ButtonGroupView role="toolbar">
        <button type="button">x</button>
      </ButtonGroupView>,
    );
    expect(screen.getByRole('toolbar')).toBeInTheDocument();
  });

  it('forwards role="group" as the DOM role attribute', () => {
    render(
      <ButtonGroupView role="group">
        <button type="button">x</button>
      </ButtonGroupView>,
    );
    expect(screen.getByRole('group')).toBeInTheDocument();
  });

  it('renders as the given container element', () => {
    const {container} = render(
      <ButtonGroupView as="span">
        <button type="button">x</button>
      </ButtonGroupView>,
    );
    expect(container.querySelector('span[data-component="ButtonGroup"]')).toBeInTheDocument();
  });
});
