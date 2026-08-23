import {describe, it, expect} from 'vitest';
import {TimelineBreakApi} from './timeline-break.schema.js';

describe('TimelineBreakApi.schema', () => {
  it('accepts the empty object (propless leaf)', () => {
    expect(TimelineBreakApi.schema.safeParse({}).success).toBe(true);
  });

  it('rejects any prop (strict, propless)', () => {
    expect(TimelineBreakApi.schema.safeParse({className: 'x'}).success).toBe(false);
  });
});
