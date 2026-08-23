import {KeybindingHint as PrimerKeybindingHint} from '@primer/react/experimental';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {KeybindingHintApi, type KeybindingHintProps} from './keybindinghint.schema';

/**
 * Resolved props: `keys` is a plain string after the binder resolves the DynamicString.
 * KeybindingHint has no ComponentId/Action row, so there is no buildChild/onClick — the
 * content arrives through the `keys` prop and resolved values pass straight through.
 */
type KeybindingHintViewProps = Omit<KeybindingHintProps, 'keys'> & {keys: string};

export function KeybindingHintView({keys, format, variant, size}: KeybindingHintViewProps) {
  return <PrimerKeybindingHint keys={keys} format={format} variant={variant} size={size} />;
}

/**
 * Catalog entry: the generic binder resolves props, then renders KeybindingHintView.
 * Props are passed explicitly (no spread): resolved props include extra binder setters
 * that would leak as unknown props.
 */
export const KeybindingHintComponent = createComponentImplementation(
  KeybindingHintApi,
  ({props}) => (
    <KeybindingHintView
      keys={props.keys}
      format={props.format}
      variant={props.variant}
      size={props.size}
    />
  ),
);
