import {render, screen} from '@testing-library/react';
import {expect, test} from 'vitest';
import {StatusBadgeView} from './status-badge';
import {toneOf} from './tone';

test('CircleCI words and API values map to the sampled tones', () => {
  expect(toneOf('Success')).toBe('success');
  expect(toneOf('succeeded')).toBe('success');
  expect(toneOf('Failed')).toBe('failed');
  expect(toneOf('Running')).toBe('running');
  expect(toneOf('Queued')).toBe('queued');
});

test('a status with no sampled color draws neutral, never a guessed one', () => {
  expect(toneOf('Canceled')).toBe('neutral');
  expect(toneOf('On Hold')).toBe('neutral');
  expect(toneOf('')).toBe('neutral');
});

test('the word is rendered, carrying its tone on the element', () => {
  render(<StatusBadgeView status="Failed" />);
  const badge = screen.getByText('Failed');
  expect(badge).toHaveAttribute('data-tone', 'failed');
  expect(badge).toHaveClass('circleci-status');
});

test('the glyph echoes the word and is hidden from assistive technology', () => {
  render(<StatusBadgeView status="Success" />);
  expect(screen.getByText('✓')).toHaveAttribute('aria-hidden', 'true');
});
