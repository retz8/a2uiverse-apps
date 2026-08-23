import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {StackItemView} from './stackitem';

afterEach(cleanup);

describe('StackItemView', () => {
  it('renders its children', () => {
    render(
      <StackItemView>
        <span>Inner</span>
      </StackItemView>,
    );
    expect(screen.getByText('Inner')).toBeInTheDocument();
  });
});
