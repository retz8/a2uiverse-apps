import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {PageLayoutFooterView} from './pagelayout-footer';

afterEach(cleanup);

describe('PageLayoutFooterView', () => {
  it('renders its children inside the contentinfo landmark', () => {
    render(
      <PageLayoutFooterView>
        <span>© 2026 Example</span>
      </PageLayoutFooterView>,
    );
    expect(screen.getByText('© 2026 Example')).toBeInTheDocument();
    expect(screen.getByText('© 2026 Example').closest('footer')).toHaveAttribute(
      'data-component',
      'PageLayout.Footer',
    );
  });

  it('applies the accessibility label as aria-label on the contentinfo landmark', () => {
    render(
      <PageLayoutFooterView accessibility={{label: 'Site footer'}}>
        <span>© 2026 Example</span>
      </PageLayoutFooterView>,
    );
    expect(screen.getByText('© 2026 Example').closest('footer')).toHaveAttribute(
      'aria-label',
      'Site footer',
    );
  });
});
