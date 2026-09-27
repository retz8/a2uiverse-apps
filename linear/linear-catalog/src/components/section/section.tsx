import type {ReactNode} from 'react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {renderChildList} from '../../shared/child-list.js';
import {SectionApi} from './section.schema.js';

type SectionViewProps = {title: string; count?: string; children?: ReactNode};

export function SectionView({title, count, children}: SectionViewProps) {
  return (
    <section className="lc-section" aria-label={title}>
      <div className="lc-section-head">
        <h3 className="lc-section-title">{title}</h3>
        {count ? <span className="lc-count">{count}</span> : null}
      </div>
      <div className="lc-section-body">{children}</div>
    </section>
  );
}

export const Section = createComponentImplementation(SectionApi, ({props, buildChild}) => (
  <SectionView title={props.title ?? ''} count={props.count || undefined}>
    {renderChildList(props.children, buildChild)}
  </SectionView>
));
