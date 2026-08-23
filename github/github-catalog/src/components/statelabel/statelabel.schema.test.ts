import {describe, it, expect} from 'vitest';
import {StateLabelApi} from './statelabel.schema';

describe('StateLabelApi.schema', () => {
  it('accepts a minimal valid StateLabel (text + status)', () => {
    expect(StateLabelApi.schema.safeParse({text: 'Open', status: 'issueOpened'}).success).toBe(
      true,
    );
  });

  it('accepts the full prop surface', () => {
    const result = StateLabelApi.schema.safeParse({
      text: 'Open',
      status: 'issueOpened',
      size: 'small',
    });
    expect(result.success).toBe(true);
  });

  it('requires text', () => {
    expect(StateLabelApi.schema.safeParse({status: 'issueOpened'}).success).toBe(false);
  });

  it('requires status', () => {
    expect(StateLabelApi.schema.safeParse({text: 'Open'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(
      StateLabelApi.schema.safeParse({text: 'Open', status: 'issueOpened', variant: 'small'})
        .success,
    ).toBe(false);
  });

  it('rejects out-of-enum status values', () => {
    expect(StateLabelApi.schema.safeParse({text: 'Open', status: 'reopened'}).success).toBe(false);
  });

  it('rejects out-of-enum size values', () => {
    expect(
      StateLabelApi.schema.safeParse({text: 'Open', status: 'issueOpened', size: 'large'}).success,
    ).toBe(false);
  });

  it('accepts a data-binding for text (DynamicString)', () => {
    expect(
      StateLabelApi.schema.safeParse({text: {path: '/state'}, status: 'pullMerged'}).success,
    ).toBe(true);
  });
});
