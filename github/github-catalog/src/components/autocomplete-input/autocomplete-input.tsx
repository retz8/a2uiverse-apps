import type {ChangeEvent, HTMLProps, ReactElement, ReactNode} from 'react';
import {Autocomplete as PrimerAutocomplete} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {AutocompleteInputApi} from './autocomplete-input.schema';

/** Resolved accessibility: nested DynamicStrings are plain strings after the binder resolves them. */
type ResolvedAccessibility = {label?: string; description?: string};

/**
 * Resolved props: `value` is the plain string after the binder resolves the DynamicString (optional
 * — the field may be managed entirely by the Autocomplete context), `setValue` is the binder's
 * auto-generated two-way setter. `placeholder`/`disabled`/`loading` are resolved primitives; the
 * enum/plain props pass through; the three ComponentId slots arrive as built children (ReactNode).
 */
type AutocompleteInputViewProps = {
  value?: string;
  setValue?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  validationStatus?: 'error' | 'success';
  type?: 'text' | 'search';
  loading?: boolean;
  loaderPosition?: 'auto' | 'leading' | 'trailing';
  loaderText?: string;
  size?: 'small' | 'medium' | 'large';
  block?: boolean;
  contrast?: boolean;
  monospace?: boolean;
  characterLimit?: number;
  accessibility?: ResolvedAccessibility;
  leadingVisual?: ReactNode;
  trailingVisual?: ReactNode;
  trailingAction?: ReactNode;
};

export function AutocompleteInputView({
  value,
  setValue,
  placeholder,
  disabled,
  required,
  validationStatus,
  type,
  loading,
  loaderPosition,
  loaderText,
  size,
  block,
  contrast,
  monospace,
  characterLimit,
  accessibility,
  leadingVisual,
  trailingVisual,
  trailingAction,
}: AutocompleteInputViewProps) {
  // Primer's Autocomplete.Input calls the supplied `onChange` AND, internally, `setInputValue` (to
  // drive local filtering through the Autocomplete context). We only need `onChange` to write the
  // typed query back to the bound data-model path (a no-op when unbound). `value` seeds the context
  // input value on mount; when unbound the Input owns its own text.
  return (
    <PrimerAutocomplete.Input
      value={value}
      onChange={(e: ChangeEvent<HTMLInputElement>) => setValue?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      validationStatus={validationStatus}
      type={type}
      loading={loading}
      loaderPosition={loaderPosition}
      loaderText={loaderText}
      size={size}
      block={block}
      contrast={contrast}
      monospace={monospace}
      characterLimit={characterLimit}
      leadingVisual={leadingVisual}
      trailingVisual={trailingVisual}
      trailingAction={
        trailingAction as unknown as ReactElement<HTMLProps<HTMLButtonElement>> | undefined
      }
      aria-label={accessibility?.label}
      aria-description={accessibility?.description}
    />
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders AutocompleteInputView.
 * - `props.value` is the resolved (optional) string; `props.setValue` is the auto-generated two-way
 *   setter wired onto onChange so user edits flow back to the bound data-model path.
 * - the three ComponentId slots are resolved via buildChild, each guarded on presence.
 * - `props.accessibility` carries resolved (plain-string) label/description at runtime; its inferred
 *   type still shows the nested DynamicString, so it is cast to the resolved shape.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const AutocompleteInputComponent = createComponentImplementation(
  AutocompleteInputApi,
  ({props, buildChild}) => (
    <AutocompleteInputView
      value={props.value}
      setValue={props.setValue}
      placeholder={props.placeholder}
      disabled={props.disabled}
      required={props.required}
      validationStatus={props.validationStatus}
      type={props.type}
      loading={props.loading}
      loaderPosition={props.loaderPosition}
      loaderText={props.loaderText}
      size={props.size}
      block={props.block}
      contrast={props.contrast}
      monospace={props.monospace}
      characterLimit={props.characterLimit}
      accessibility={props.accessibility as ResolvedAccessibility | undefined}
      leadingVisual={props.leadingVisual ? buildChild(props.leadingVisual) : undefined}
      trailingVisual={props.trailingVisual ? buildChild(props.trailingVisual) : undefined}
      trailingAction={props.trailingAction ? buildChild(props.trailingAction) : undefined}
    />
  ),
);
