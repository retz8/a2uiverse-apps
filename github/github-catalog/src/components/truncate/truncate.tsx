import type {ComponentType, ReactNode} from 'react';
import {Truncate as PrimerTruncate} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {TruncateApi, type TruncateProps} from './truncate.schema';

/**
 * Resolved props: `text` and `title` are plain strings after the binder resolves the
 * DynamicStrings. `text` renders as the truncated content (children); `title` is the full
 * untruncated text carried onto the host element (assistive-tech label + hover tooltip);
 * `inline`/`expandable`/`maxWidth`/`as` pass through unchanged.
 */
type TruncateViewProps = Omit<TruncateProps, 'text' | 'title'> & {
  text: string;
  title: string;
};

/**
 * Primer Truncate is a strict polymorphic (`PolymorphicForwardRefComponent<"div", …>`)
 * whose per-element overloads reject an `as` chosen at runtime from a union. Cast it to a
 * plain component typed with exactly the prop surface we drive; the `as` enum is already
 * validated by the schema, so the cast is sound.
 */
const Truncate = PrimerTruncate as unknown as ComponentType<{
  as?: 'div' | 'span' | 'p';
  title: string;
  inline?: boolean;
  expandable?: boolean;
  maxWidth?: string;
  children?: ReactNode;
}>;

export function TruncateView({text, title, inline, expandable, maxWidth, as}: TruncateViewProps) {
  return (
    <Truncate as={as} title={title} inline={inline} expandable={expandable} maxWidth={maxWidth}>
      {text}
    </Truncate>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders TruncateView. Truncate
 * has no ComponentId/Action row, so there is no buildChild/onClick — resolved values pass
 * straight through. Props are passed explicitly (no spread): resolved props include extra
 * binder setters that would leak as unknown DOM props.
 */
export const TruncateComponent = createComponentImplementation(TruncateApi, ({props}) => (
  <TruncateView
    text={props.text}
    title={props.title}
    inline={props.inline}
    expandable={props.expandable}
    maxWidth={props.maxWidth}
    as={props.as}
  />
));
