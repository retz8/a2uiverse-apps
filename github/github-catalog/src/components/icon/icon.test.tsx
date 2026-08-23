import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import * as octicons from '@primer/octicons-react';
import {IconView, nameToExport} from './icon';
import {ICON_NAMES} from './icon.schema';

afterEach(cleanup);

describe('IconView', () => {
  it('renders the named icon as an svg', () => {
    const {container} = render(<IconView name="alert" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('exposes a labeled icon to assistive tech (role="img" + aria-label)', () => {
    render(<IconView name="check" accessibility={{label: 'Passed'}} />);
    const el = screen.getByRole('img', {name: 'Passed'});
    expect(el).toHaveAttribute('aria-label', 'Passed');
  });

  it('hides an unlabeled icon from assistive tech (aria-hidden)', () => {
    const {container} = render(<IconView name="check" />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).not.toHaveAttribute('aria-label');
  });

  it('maps a semantic fill role to its Primer foreground token', () => {
    const {container} = render(<IconView name="heart-fill" fill="danger" />);
    expect(container.querySelector('svg')).toHaveAttribute('fill', 'var(--fgColor-danger)');
  });

  it('leaves fill unset for the default role (inherits currentColor)', () => {
    const {container} = render(<IconView name="heart-fill" fill="default" />);
    expect(container.querySelector('svg')).toHaveAttribute('fill', 'currentColor');
  });

  it('honors the size keyword', () => {
    const {container} = render(<IconView name="rocket" size="large" />);
    // small/medium/large map to 16/32/64 px on the wrapped octicon.
    expect(container.querySelector('svg')).toHaveAttribute('width', '64');
  });
});

describe('name -> export mapping totality', () => {
  it('every one of the 379 enum names resolves to a real octicon export', () => {
    // octicon components are React.memo/forwardRef objects, not bare functions, so
    // resolution is "the export exists", not "typeof === function".
    const exports = octicons as unknown as Record<string, unknown>;
    const unresolved = ICON_NAMES.filter(name => exports[nameToExport(name)] == null);
    expect(unresolved).toEqual([]);
    expect(ICON_NAMES).toHaveLength(379);
  });
});
