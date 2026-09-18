/**
 * The tone a status word draws in. Keyed on CircleCI's own words and on the API's outcome and
 * phase values, lower-cased. A status with no sampled color draws neutral rather than guessed.
 */
const TONES: Record<string, Tone> = {
  success: 'success',
  succeeded: 'success',
  failed: 'failed',
  failing: 'failed',
  running: 'running',
  started: 'running',
  queued: 'queued',
  created: 'queued',
};

export type Tone = 'success' | 'failed' | 'running' | 'queued' | 'neutral';

/** CircleCI's pill glyphs: a check, a cross, a spin arrow. The word is the signal; this echoes it. */
export const GLYPHS: Partial<Record<Tone, string>> = {success: '✓', failed: '✕', running: '↻'};

export function toneOf(status: string): Tone {
  return TONES[status.trim().toLowerCase()] ?? 'neutral';
}
