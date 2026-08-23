import type {ChangeEvent, HTMLProps, ReactElement, ReactNode} from 'react';
import {TextInput as PrimerTextInput} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {TextInputApi} from './textinput.schema';
import {useFormControlInputProps} from '../../shared/form-control-forwarding';

/** Resolved accessibility: nested DynamicStrings are plain strings after the binder resolves them. */
type ResolvedAccessibility = {label?: string; description?: string};

/**
 * Resolved props: `value` is the plain string after the binder resolves the DynamicString, and
 * `setValue` is the binder's auto-generated two-way setter (user edits write back to the bound
 * data-model path). `placeholder`/`disabled`/`loading` are resolved primitives; the enum/plain
 * props pass through; the three ComponentId slots arrive as built children (ReactNode).
 */
type TextInputViewProps = {
  value: string;
  setValue?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  validationStatus?: 'error' | 'success';
  type?: 'text' | 'password' | 'email' | 'number' | 'search' | 'tel' | 'url';
  loading?: boolean;
  loaderPosition?: 'auto' | 'leading' | 'trailing';
  loaderText?: string;
  size?: 'small' | 'medium' | 'large';
  block?: boolean;
  contrast?: boolean;
  monospace?: boolean;
  characterLimit?: number;
  accessibility?: ResolvedAccessibility;
  // Element-typed Primer slots, each built from a ComponentId child. Primer renders an already-
  // built element directly (isValidElementType is false for a rendered element), so a ReactNode
  // flows straight through; trailingAction is typed ReactElement-only and is cast.
  leadingVisual?: ReactNode;
  trailingVisual?: ReactNode;
  trailingAction?: ReactNode;
};

export function TextInputView({
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
}: TextInputViewProps) {
  // Pick up id / disabled / required / aria-describedby from an enclosing FormControl (no-op when
  // standalone); disabled/required come from here, so they are not passed explicitly below.
  const formControlProps = useFormControlInputProps({disabled, required});
  return (
    <PrimerTextInput
      {...formControlProps}
      value={value}
      onChange={(e: ChangeEvent<HTMLInputElement>) => setValue?.(e.target.value)}
      placeholder={placeholder}
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
 * Catalog entry: the generic binder resolves props, then renders TextInputView.
 * - `props.value` is the resolved string; `props.setValue` is the auto-generated two-way setter
 *   wired onto onChange so user edits flow back to the bound data-model path.
 * - the three ComponentId slots are resolved via buildChild, each guarded on presence
 *   (buildChild requires a string id).
 * - `props.accessibility` carries resolved (plain-string) label/description at runtime; its
 *   inferred type still shows the nested DynamicString, so it is cast to the resolved shape.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const TextInputComponent = createComponentImplementation(
  TextInputApi,
  ({props, buildChild}) => (
    <TextInputView
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
