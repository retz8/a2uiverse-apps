import {createComponentImplementation} from '@a2ui/react/v0_9';
import type {IconName} from '../../icons.generated.js';
import {Glyph} from '../../shared/glyph.js';
import {pressOnKey} from '../../shared/press.js';
import {NavigationItemApi} from './navigation-item.schema.js';

type NavigationItemViewProps = {
  label: string;
  icon?: IconName;
  count?: string;
  active?: boolean;
  onPress?: () => void;
};

export function NavigationItemView({label, icon, count, active, onPress}: NavigationItemViewProps) {
  const interactive = onPress !== undefined;
  return (
    <div
      className="gm-nav-item"
      data-active={active ? '' : undefined}
      data-interactive={interactive ? '' : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-current={active ? 'page' : undefined}
      onClick={onPress}
      onKeyDown={interactive ? pressOnKey(onPress) : undefined}
    >
      {icon ? <Glyph name={icon} filled={active} /> : null}
      <span className="gm-nav-label">{label}</span>
      {count ? <span className="gm-nav-count">{count}</span> : null}
    </div>
  );
}

export const NavigationItem = createComponentImplementation(NavigationItemApi, ({props}) => (
  <NavigationItemView
    label={props.label ?? ''}
    icon={props.icon}
    count={props.count}
    active={props.active}
    onPress={props.action}
  />
));
