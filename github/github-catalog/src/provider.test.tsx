import {describe, expect, it} from 'vitest';
import {render, screen} from '@testing-library/react';
import {Portal} from '@primer/react';
import {Provider} from './provider';

describe('Provider', () => {
  it('wraps the fragment in the catalog scope element', () => {
    render(
      <Provider>
        <span>inside</span>
      </Provider>,
    );
    expect(screen.getByText('inside').closest('.github-catalog-scope')).not.toBeNull();
  });

  it('keeps a Primer portal inside the scope element', () => {
    render(
      <Provider>
        <Portal>
          <span>overlay</span>
        </Portal>
      </Provider>,
    );
    expect(screen.getByText('overlay').closest('.github-catalog-scope')).not.toBeNull();
  });
});
