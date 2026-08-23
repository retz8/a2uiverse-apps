import {describe, it, expect} from 'vitest';
import {ProgressBarApi} from './progressbar.schema';

describe('ProgressBarApi.schema', () => {
  it('accepts an empty ProgressBar (nothing is required — empty track)', () => {
    expect(ProgressBarApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts a single-bar ProgressBar (literal progress)', () => {
    expect(ProgressBarApi.schema.safeParse({progress: 65}).success).toBe(true);
  });

  it('accepts the full single-bar surface', () => {
    expect(
      ProgressBarApi.schema.safeParse({
        progress: 65,
        bg: 'accent',
        barSize: 'large',
        inline: true,
        animated: true,
        accessibility: {label: 'Upload progress', description: 'Uploading files'},
      }).success,
    ).toBe(true);
  });

  it('accepts a multi-segment ProgressBar', () => {
    expect(
      ProgressBarApi.schema.safeParse({
        segments: [
          {progress: 55, bg: 'success', label: 'TypeScript'},
          {progress: 30, bg: 'accent', label: 'CSS'},
          {progress: 15},
        ],
      }).success,
    ).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(ProgressBarApi.schema.safeParse({progress: 65, color: 'red'}).success).toBe(false);
  });

  it('rejects unknown props inside a segment (strict)', () => {
    expect(
      ProgressBarApi.schema.safeParse({segments: [{progress: 55, color: 'red'}]}).success,
    ).toBe(false);
  });

  it('requires progress on each segment', () => {
    expect(ProgressBarApi.schema.safeParse({segments: [{bg: 'success'}]}).success).toBe(false);
  });

  it('rejects an out-of-enum bg', () => {
    expect(ProgressBarApi.schema.safeParse({progress: 65, bg: 'purple'}).success).toBe(false);
  });

  it('rejects an out-of-enum barSize', () => {
    expect(ProgressBarApi.schema.safeParse({progress: 65, barSize: 'medium'}).success).toBe(false);
  });

  it('rejects an out-of-enum bg on a segment', () => {
    expect(
      ProgressBarApi.schema.safeParse({segments: [{progress: 55, bg: 'purple'}]}).success,
    ).toBe(false);
  });

  it('accepts a data-binding for progress (DynamicNumber)', () => {
    expect(ProgressBarApi.schema.safeParse({progress: {path: '/completion'}}).success).toBe(true);
  });

  it('accepts a data-binding for a segment progress (DynamicNumber)', () => {
    expect(
      ProgressBarApi.schema.safeParse({segments: [{progress: {path: '/tsShare'}}]}).success,
    ).toBe(true);
  });

  it('accepts a data-binding for a segment label (DynamicString)', () => {
    expect(
      ProgressBarApi.schema.safeParse({segments: [{progress: 55, label: {path: '/lang'}}]}).success,
    ).toBe(true);
  });

  it('accepts a data-binding for the accessibility label (DynamicString)', () => {
    expect(
      ProgressBarApi.schema.safeParse({progress: 65, accessibility: {label: {path: '/what'}}})
        .success,
    ).toBe(true);
  });
});
