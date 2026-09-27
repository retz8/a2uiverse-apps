import {render} from '@testing-library/react';
import {expect, test} from 'vitest';
import {StatusGlyph, toneOf} from './status';

test('CircleCI words and API values map to their tones', () => {
  expect(toneOf('Success')).toBe('success');
  expect(toneOf('succeeded')).toBe('success');
  expect(toneOf('Failed')).toBe('failed');
  expect(toneOf('infrastructure_fail')).toBe('failed');
  expect(toneOf('Running')).toBe('running');
  expect(toneOf('On Hold')).toBe('hold');
  expect(toneOf('on_hold')).toBe('hold');
  expect(toneOf('Queued')).toBe('queued');
  expect(toneOf('not_running')).toBe('queued');
});

test('a word with no tone of its own draws neutral', () => {
  expect(toneOf('Canceled')).toBe('neutral');
  expect(toneOf('not_run')).toBe('neutral');
  expect(toneOf('')).toBe('neutral');
});

test('every tone has a glyph, hidden from assistive technology', () => {
  for (const tone of ['success', 'failed', 'running', 'hold', 'queued', 'neutral'] as const) {
    const {container} = render(<StatusGlyph tone={tone} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg?.childElementCount).toBeGreaterThan(0);
  }
});
