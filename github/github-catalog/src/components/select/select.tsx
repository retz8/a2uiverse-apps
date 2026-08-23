import type {ChangeEvent, ReactNode} from 'react';
import {Select as PrimerSelect} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {useFormControlInputProps} from '../../shared/form-control-forwarding';
import {SelectApi} from './select.schema';
import {renderChildList} from '../../shared/child-list';

/** Resolved accessibility: nested DynamicStrings are plain strings after the binder resolves them. */
type ResolvedAccessibility = {label?: string; description?: string};

/**
 * Resolved props: `value` is the plain string after the binder resolves the DynamicString, and
 * `setValue` is the binder's auto-generated two-way setter (a user's selection writes back to the
 * bound data-model path). `children` arrives as a built `ChildList`; the rest are resolved
 * primitives that pass through.
 */
type SelectViewProps = {
  value: string;
  setValue?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  validationStatus?: 'error' | 'success';
  block?: boolean;
  size?: 'small' | 'medium' | 'large';
  accessibility?: ResolvedAccessibility;
  children?: ReactNode;
};

export function SelectView({
  value,
  setValue,
  placeholder,
  disabled,
  required,
  validationStatus,
  block,
  size,
  accessibility,
  children,
}: SelectViewProps) {
  // Pick up id / disabled / required / aria-describedby from an enclosing FormControl (no-op when
  // standalone); disabled/required come from here, so they are not passed explicitly below.
  const formControlProps = useFormControlInputProps({disabled, required});
  return (
    <PrimerSelect
      {...formControlProps}
      value={value}
      onChange={(e: ChangeEvent<HTMLSelectElement>) => setValue?.(e.target.value)}
      placeholder={placeholder}
      validationStatus={validationStatus}
      block={block}
      size={size}
      aria-label={accessibility?.label}
      aria-description={accessibility?.description}
    >
      {children}
    </PrimerSelect>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders SelectView.
 * - `props.value` is the resolved string; `props.setValue` is the auto-generated two-way setter
 *   wired onto onChange so a user's selection flows back to the bound data-model path.
 * - `props.children` is a resolved `ChildList` of `Select.Option`/`Select.OptGroup`;
 *   `renderChildList` builds each via `buildChild` as the native `<select>`'s option children.
 * - `props.accessibility` carries resolved (plain-string) label/description at runtime; its
 *   inferred type still shows the nested DynamicString, so it is cast to the resolved shape.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const SelectComponent = createComponentImplementation(SelectApi, ({props, buildChild}) => (
  <SelectView
    value={props.value}
    setValue={props.setValue}
    placeholder={props.placeholder}
    disabled={props.disabled}
    required={props.required}
    validationStatus={props.validationStatus}
    block={props.block}
    size={props.size}
    accessibility={props.accessibility as ResolvedAccessibility | undefined}
  >
    {renderChildList(props.children, buildChild)}
  </SelectView>
));
