import {describe, it, expect} from 'vitest';
import {render, cleanup} from '@testing-library/react';
import {afterEach} from 'vitest';
import {SelectPanelItemView} from './selectpanel-item';

afterEach(cleanup);

describe('SelectPanelItemView', () => {
  it('is a data-carrier leaf — it renders nothing on its own (its parent reads its props as items data)', () => {
    const {container} = render(<SelectPanelItemView />);
    expect(container).toBeEmptyDOMElement();
  });
});
