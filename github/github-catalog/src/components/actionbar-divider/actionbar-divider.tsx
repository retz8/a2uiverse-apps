import {ActionBar as PrimerActionBar} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {ActionBarDividerApi} from './actionbar-divider.schema';

/** Zero-prop view: a thin `aria-hidden` vertical separator provided by Primer. */
export function ActionBarDividerView() {
  return <PrimerActionBar.Divider />;
}

/**
 * Catalog entry: `ActionBar.Divider` has no props, no ComponentId/Action rows, so there is no
 * buildChild/onClick — it renders Primer's `ActionBar.Divider` directly. Standalone it is an
 * `aria-hidden` separator; inside an `ActionBar` it also registers as a divider item preserved in
 * the overflow menu.
 */
export const ActionBarDividerComponent = createComponentImplementation(ActionBarDividerApi, () => (
  <ActionBarDividerView />
));
