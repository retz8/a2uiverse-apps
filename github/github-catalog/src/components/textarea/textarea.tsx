import type {ChangeEvent} from 'react';
import {Textarea as PrimerTextarea} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {useFormControlInputProps} from '../../shared/form-control-forwarding';
import {TextareaApi} from './textarea.schema';

/** Resolved accessibility: nested DynamicStrings are plain strings after the binder resolves them. */
type ResolvedAccessibility = {label?: string; description?: string};

/**
 * Resolved props: `value` is the plain string after the binder resolves the DynamicString, and
 * `setValue` is the binder's auto-generated two-way setter (user edits write back to the bound
 * data-model path). `placeholder`/`disabled` are resolved primitives; the rest pass through.
 */
type TextareaViewProps = {
  value: string;
  setValue?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  validationStatus?: 'error' | 'success';
  block?: boolean;
  resize?: 'none' | 'both' | 'horizontal' | 'vertical';
  contrast?: boolean;
  rows?: number;
  cols?: number;
  characterLimit?: number;
  minHeight?: number;
  maxHeight?: number;
  accessibility?: ResolvedAccessibility;
};

export function TextareaView({
  value,
  setValue,
  placeholder,
  disabled,
  required,
  validationStatus,
  block,
  resize,
  contrast,
  rows,
  cols,
  characterLimit,
  minHeight,
  maxHeight,
  accessibility,
}: TextareaViewProps) {
  // Pick up id / disabled / required / aria-describedby from an enclosing FormControl (no-op when
  // standalone); disabled/required come from here, so they are not passed explicitly below.
  const formControlProps = useFormControlInputProps({disabled, required});
  return (
    <PrimerTextarea
      {...formControlProps}
      value={value}
      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setValue?.(e.target.value)}
      placeholder={placeholder}
      validationStatus={validationStatus}
      block={block}
      resize={resize}
      contrast={contrast}
      rows={rows}
      cols={cols}
      characterLimit={characterLimit}
      minHeight={minHeight}
      maxHeight={maxHeight}
      aria-label={accessibility?.label}
      aria-description={accessibility?.description}
    />
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders TextareaView.
 * - `props.value` is the resolved string; `props.setValue` is the auto-generated two-way setter
 *   wired onto onChange so user edits flow back to the bound data-model path.
 * - `props.accessibility` carries resolved (plain-string) label/description at runtime; its
 *   inferred type still shows the nested DynamicString, so it is cast to the resolved shape.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const TextareaComponent = createComponentImplementation(TextareaApi, ({props}) => (
  <TextareaView
    value={props.value}
    setValue={props.setValue}
    placeholder={props.placeholder}
    disabled={props.disabled}
    required={props.required}
    validationStatus={props.validationStatus}
    block={props.block}
    resize={props.resize}
    contrast={props.contrast}
    rows={props.rows}
    cols={props.cols}
    characterLimit={props.characterLimit}
    minHeight={props.minHeight}
    maxHeight={props.maxHeight}
    accessibility={props.accessibility as ResolvedAccessibility | undefined}
  />
));
