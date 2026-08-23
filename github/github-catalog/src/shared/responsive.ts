import {z} from 'zod';

/**
 * A schema for a prop that accepts a single value or a per-viewport responsive map. Primer's
 * `ResponsiveValue<T>` is `{ narrow?; regular?; wide? }`; this carries both the scalar arm and
 * that object arm faithfully (not a scalar-only projection — dropping the arm would lose a real,
 * documented per-viewport capability). The catalog's standing convention for every
 * `ResponsiveValue`-bearing Primer prop; generalizes over enums (Stack's scale props) and
 * booleans (Stack.Item's `grow`/`shrink`).
 *
 * The generic binder classifies this union as STATIC (it is not Dynamic/Action/ChildList), so the
 * resolved value — scalar or object — passes through to the Primer component untouched.
 */
export function responsive<T extends z.ZodTypeAny>(inner: T) {
  return z.union([
    inner,
    z.object({
      narrow: inner.optional(),
      regular: inner.optional(),
      wide: inner.optional(),
    }),
  ]);
}
