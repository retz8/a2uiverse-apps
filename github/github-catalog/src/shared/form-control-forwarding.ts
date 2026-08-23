import {useFormControlForwardedProps} from '@primer/react';

/**
 * Reads the accessibility props (`id` / `disabled` / `required` / `aria-describedby`) that a Primer
 * `FormControl` forwards to its wrapped input, for an adapter input View to spread onto the Primer
 * input it renders.
 *
 * Why this is needed: Primer's `FormControl` normally injects these onto the input it detects by
 * element type (`cloneElement`), but the a2ui binder renders every child through an opaque
 * `DeferredChild`, so that type detection never matches and the input receives nothing. Primer's
 * public `useFormControlForwardedProps` hook instead reads the same values from `FormControlContext`
 * — which flows through the wrapper untouched — giving the input its `id` (↔ label `htmlFor`),
 * `disabled`/`required` cascade, and `aria-describedby` (caption + validation message ids). Outside a
 * `FormControl` the hook is a no-op.
 *
 * The input's own `disabled`/`required` are forwarded ONLY when explicitly set, so a binder-supplied
 * `undefined` does not clobber the value cascading from the FormControl root (the hook lets the
 * passed-in props win). An explicitly-authored value on the input still takes priority.
 */
export function useFormControlInputProps(own: {disabled?: boolean; required?: boolean}): {
  id?: string;
  disabled?: boolean;
  required?: boolean;
  'aria-describedby'?: string;
} {
  return useFormControlForwardedProps({
    ...(own.disabled !== undefined ? {disabled: own.disabled} : {}),
    ...(own.required !== undefined ? {required: own.required} : {}),
  });
}
