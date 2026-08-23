import {describe, it, expect} from 'vitest';
import {IconApi} from './icon.schema';

describe('IconApi.schema', () => {
  it('accepts a minimal valid Icon (name only)', () => {
    expect(IconApi.schema.safeParse({name: 'alert'}).success).toBe(true);
  });

  it('accepts the full prop surface', () => {
    const result = IconApi.schema.safeParse({
      name: 'git-pull-request',
      size: 'large',
      fill: 'success',
      accessibility: {label: 'Open pull request'},
    });
    expect(result.success).toBe(true);
  });

  it('requires name', () => {
    expect(IconApi.schema.safeParse({size: 'small'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(IconApi.schema.safeParse({name: 'alert', color: 'red'}).success).toBe(false);
  });

  it('rejects an out-of-enum name', () => {
    expect(IconApi.schema.safeParse({name: 'not-a-real-icon'}).success).toBe(false);
  });

  it('rejects an out-of-enum size', () => {
    expect(IconApi.schema.safeParse({name: 'alert', size: 'huge'}).success).toBe(false);
  });

  it('rejects an out-of-enum fill', () => {
    expect(IconApi.schema.safeParse({name: 'alert', fill: 'purple'}).success).toBe(false);
  });

  it('accepts a data-binding for the accessibility label (DynamicString)', () => {
    expect(
      IconApi.schema.safeParse({name: 'alert', accessibility: {label: {path: '/iconLabel'}}})
        .success,
    ).toBe(true);
  });
});
